# Shiroine - Free WhatsApp Bot Landing Page

A modern, responsive landing page for a WhatsApp Bot service. Built with vanilla HTML, CSS, and JavaScript for fast loading and easy deployment.

![Shiroine WhatsApp Bot](https://img.shields.io/badge/WhatsApp-Bot-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

## 🚀 Features

- **Modern Design**: Clean, professional interface with gradient backgrounds and smooth animations
- **Fully Responsive**: Works perfectly on mobile, tablet, and desktop devices
- **Interactive Elements**: 
  - Animated hero section with floating phone mockup
  - Accordion FAQ section
  - Form validation with success modal
  - Scroll reveal animations
- **No Dependencies**: Pure vanilla JavaScript - no frameworks required
- **Fast Loading**: Optimized CSS and JavaScript for quick load times
- **SEO Friendly**: Semantic HTML5 markup with proper meta tags

## 📁 Project Structure

```
shiroine-web/
├── index.html          # Main landing page
├── css/
│   └── style.css       # All styles with CSS variables
├── js/
│   └── main.js         # JavaScript functionality
└── README.md           # This file
```

## 🎨 Sections

1. **Navigation**: Fixed navbar with mobile hamburger menu
2. **Hero Section**: Eye-catching header with animated phone mockup, stats, and CTAs
3. **Features Section**: 6 key features in a responsive grid
4. **How It Works**: 3-step guide with visual connectors
5. **Demo Section**: WhatsApp connection form with validation
6. **FAQ Section**: Expandable accordion with common questions
7. **Footer**: Brand info, navigation links, and social media

## 🛠️ Technologies

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Flexbox, Grid, animations
- **JavaScript**: ES6+, Intersection Observer API
- **Fonts**: Google Fonts (Inter)

## 🚀 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/suhwr/shiroine-web.git
   cd shiroine-web
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

3. Visit `http://localhost:8000` in your browser

### Deployment

This is a static website that can be deployed to any hosting service:

- **GitHub Pages**: Push to `gh-pages` branch or enable in repository settings
- **Netlify**: Drag and drop the folder or connect your Git repository
- **Vercel**: Import your Git repository
- **Any Static Host**: Upload files via FTP/SFTP

## 🎨 Customization

### Colors

Edit CSS variables in `css/style.css`:

```css
:root {
    --primary: #25D366;        /* WhatsApp green */
    --secondary: #7C3AED;      /* Purple accent */
    --accent: #06B6D4;         /* Cyan accent */
    --bg-dark: #0A0A0F;        /* Background */
}
```

### Content

- Edit `index.html` to change text content
- Update feature cards, FAQ items, and footer links
- Replace placeholder social links with actual URLs

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue in this repository.

---

Made with ❤️ for the WhatsApp community