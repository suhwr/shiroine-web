# Shiroine Bot Website

This is the official website for Shiroine WhatsApp Bot, built with React.

## Features

- **Home Page**: Overview of bot features and capabilities
- **Pricing Page**: Premium plan options for users and groups
- **Checkout Page**: Integrated payment system with Tripay gateway
- **Responsive Design**: Mobile-friendly interface
- **Multi-language Support**: Indonesian and English

## Payment Integration

The website includes integration with [Tripay Payment Gateway](https://tripay.co.id) for processing premium plan purchases. Users can pay using:
- Virtual Account (Bank Transfer)
- E-Wallet (QRIS, GoPay, OVO, DANA, etc.)
- Retail Outlets (Alfamart, Indomaret, etc.)

**Important**: For production deployment, you need to configure Tripay API credentials. See [TRIPAY_INTEGRATION.md](./TRIPAY_INTEGRATION.md) for detailed setup instructions.

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
REACT_APP_BACKEND_URL=https://shiroine.my.id
REACT_APP_TRIPAY_MODE=sandbox
REACT_APP_TRIPAY_API_KEY=your_api_key
REACT_APP_TRIPAY_PRIVATE_KEY=your_private_key
REACT_APP_TRIPAY_MERCHANT_CODE=your_merchant_code
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Project Structure

```
src/
├── components/
│   ├── Home.jsx          # Landing page
│   ├── Pricing.jsx       # Premium plans page
│   ├── Checkout.jsx      # Payment checkout page
│   └── ui/               # Reusable UI components
├── config.js             # Configuration constants
├── translations.js       # Multi-language support
└── App.js                # Main app component with routing
```

## Documentation

- [Tripay Integration Guide](./TRIPAY_INTEGRATION.md) - Payment gateway setup and configuration

## License

This project is part of the Shiroine Bot ecosystem.

## Support

For questions or issues, contact:
- Email: sherdi240@gmail.com
- WhatsApp: +62 831-5666-9609
