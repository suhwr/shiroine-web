package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"
)

// Random string generator
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// Parse plan details from plan ID
func parsePlanDetails(planID string) (days int, specialLimit int, isGroup bool) {
	isGroup = strings.HasPrefix(planID, "group-")

	switch planID {
	// User plans
	case "user-5d":
		return 7, 5, false // 7 days, 5 special limit
	case "user-15d":
		return 15, 10, false // 15 days, 10 special limit
	case "user-1m":
		return 30, 15, false // 30 days, 15 special limit
	// Group plans
	case "group-15d":
		return 15, 30, true // 15 days, 30 special limit
	case "group-1m":
		return 30, 50, true // 30 days, 50 special limit
	default:
		return 0, 0, false
	}
}

// activatePremium activates premium for a user/group based on payment reference
func activatePremium(db *sql.DB, reference string) error {
	// Get transaction details to activate premium
	var phoneNumber, groupID sql.NullString
	var orderItemsJSON []byte
	err := db.QueryRow(`
		SELECT phone_number, group_id, order_items 
		FROM payment_history 
		WHERE reference = $1 OR merchant_ref = $1
	`, reference).Scan(&phoneNumber, &groupID, &orderItemsJSON)

	if err != nil {
		return fmt.Errorf("failed to query payment_history for reference %s: %v", reference, err)
	}

	phoneStr := "nil"
	if phoneNumber.Valid {
		phoneStr = phoneNumber.String
	}
	groupStr := "nil"
	if groupID.Valid {
		groupStr = groupID.String
	}
	log.Printf("Retrieved payment details: phoneNumber=%s, groupID=%s, orderItemsSize=%d bytes",
		phoneStr, groupStr, len(orderItemsJSON))

	// Parse order items to get plan details
	var orderItems []map[string]interface{}
	unmarshalErr := json.Unmarshal(orderItemsJSON, &orderItems)
	if unmarshalErr != nil {
		return fmt.Errorf("failed to unmarshal order_items: %v", unmarshalErr)
	}

	log.Printf("Parsed %d order items", len(orderItems))

	if len(orderItems) == 0 {
		return fmt.Errorf("no order items found in payment_history for reference %s", reference)
	}

	planName := ""
	if name, ok := orderItems[0]["name"].(string); ok {
		planName = name
	}
	log.Printf("Plan name from order_items: %s", planName)

	// Extract plan ID from name with improved pattern matching
	planID := ""
	nameLower := strings.ToLower(planName)

	if strings.Contains(nameLower, "user premium") {
		// Match specific day counts to avoid ambiguity
		if strings.Contains(nameLower, "5 day") || strings.Contains(nameLower, "5 hari") {
			planID = "user-5d"
		} else if strings.Contains(nameLower, "15 day") || strings.Contains(nameLower, "15 hari") {
			planID = "user-15d"
		} else if strings.Contains(nameLower, "30 day") || strings.Contains(nameLower, "30 hari") || strings.Contains(nameLower, "1 month") || strings.Contains(nameLower, "1 bulan") {
			planID = "user-1m"
		}
	} else if strings.Contains(nameLower, "group premium") || strings.Contains(nameLower, "grup premium") {
		if strings.Contains(nameLower, "15 day") || strings.Contains(nameLower, "15 hari") {
			planID = "group-15d"
		} else if strings.Contains(nameLower, "30 day") || strings.Contains(nameLower, "30 hari") || strings.Contains(nameLower, "1 month") || strings.Contains(nameLower, "1 bulan") {
			planID = "group-1m"
		}
	}

	if planID == "" {
		return fmt.Errorf("could not determine planID from plan name: %s", planName)
	}

	log.Printf("Determined planID: %s", planID)
	days, specialLimit, isGroup := parsePlanDetails(planID)

	var jid, lid string
	if isGroup && groupID.Valid {
		jid = groupID.String
		lid = groupID.String // For groups, lid = id
		log.Printf("Group premium: jid=%s, lid=%s", jid, lid)
	} else if phoneNumber.Valid {
		jid = phoneNumber.String
		// Get lid from users table
		err = db.QueryRow("SELECT lid FROM users WHERE phone_number = $1", phoneNumber.String).Scan(&lid)
		if err != nil {
			log.Printf("Failed to get lid for phone %s: %v", phoneNumber.String, err)
			lid = phoneNumber.String // Fallback to phone number
		}
		log.Printf("User premium: jid=%s, lid=%s", jid, lid)
	} else {
		return fmt.Errorf("neither phoneNumber nor groupID is valid")
	}

	if jid == "" || lid == "" {
		return fmt.Errorf("missing jid or lid - jid=%s, lid=%s", jid, lid)
	}

	// Check if premium already exists
	var existingExpired sql.NullString
	err = db.QueryRow(`
		SELECT expired FROM premium WHERE jid = $1 AND lid = $2
	`, jid, lid).Scan(&existingExpired)

	var newExpired time.Time
	if err == sql.ErrNoRows {
		// New premium
		newExpired = time.Now().AddDate(0, 0, days)
		log.Printf("Creating new premium entry")
	} else if err == nil && existingExpired.Valid {
		// Stack premium
		currentExpired, _ := time.Parse(time.RFC3339, existingExpired.String)
		if currentExpired.Before(time.Now()) {
			newExpired = time.Now().AddDate(0, 0, days)
			log.Printf("Existing premium expired, creating new from now")
		} else {
			newExpired = currentExpired.AddDate(0, 0, days)
			log.Printf("Stacking premium on existing expiry: %s", currentExpired.Format(time.RFC3339))
		}
	} else {
		newExpired = time.Now().AddDate(0, 0, days)
		log.Printf("Error checking existing premium: %v, creating new", err)
	}

	// Upsert premium
	_, err = db.Exec(`
		INSERT INTO premium (jid, lid, special_limit, max_special_limit, expired, last_special_reset)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (jid, lid) DO UPDATE SET
			special_limit = 0,
			max_special_limit = $4,
			expired = $5,
			last_special_reset = $6
	`, jid, lid, 0, specialLimit, newExpired.Format(time.RFC3339), time.Now().Format(time.RFC3339))

	if err != nil {
		return fmt.Errorf("failed to activate premium: %v", err)
	}

	log.Printf("Premium activated for jid=%s, lid=%s, days=%d, specialLimit=%d, expired=%s",
		jid, lid, days, specialLimit, newExpired.Format(time.RFC3339))

	return nil
}
