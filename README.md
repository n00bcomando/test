# RobuxRewards - Modern Roblox Rewards Site

A full-stack Roblox rewards platform featuring deposits/withdrawals, ad gates with API integration, admin panel, and user management.

## 🚀 Features

### User Features
- **User Authentication** - Secure registration and login with JWT
- **Roblox Integration** - Username verification and Robux rewards
- **Offer Walls** - Complete offers from multiple ad networks
- **Withdrawals** - Request Robux through gamepass purchases
- **Deposits** - Add funds via PayPal and cryptocurrency
- **Referral System** - Earn bonuses for referring friends
- **Leaderboards** - Competition and user rankings
- **Profile Management** - Customize settings and view statistics

### Admin Features
- **Dashboard** - Comprehensive analytics and statistics
- **User Management** - View, edit, and manage user accounts
- **Transaction Processing** - Approve/reject withdrawals and deposits
- **Offer Management** - Control available offers and sync with APIs
- **Balance Adjustments** - Manual balance modifications with audit trail

### Technical Features
- **Modern UI** - Built with React and Tailwind CSS
- **Responsive Design** - Mobile-first approach
- **Real-time Updates** - Live balance and transaction updates
- **Security** - JWT authentication, rate limiting, input validation
- **API Integration** - AdGate, OfferToro, CPX Research support
- **Database** - MongoDB with proper indexing
- **Error Handling** - Comprehensive error management

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for API calls

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling framework
- **Headless UI** - Accessible components
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd roblox-rewards-site
```

### 2. Install server dependencies
```bash
npm install
```

### 3. Install client dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/roblox_rewards

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Ad Network APIs (optional for testing)
ADGATE_API_KEY=your_adgate_api_key
OFFERTORO_API_KEY=your_offertoro_api_key
CPXRESEARCH_API_KEY=your_cpxresearch_api_key

# Payment APIs (optional for testing)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 5. Start the application

#### Development Mode (runs both server and client)
```bash
npm run dev
```

#### Server Only
```bash
npm run server
```

#### Client Only
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Usage

### Creating an Admin Account
1. Register a normal user account
2. Access MongoDB directly or use the API to update the user's role:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Testing Offer Completions
Use the test webhook endpoint to simulate offer completions:
```bash
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "offerId": "test_offer_123",
    "amount": 100
  }'
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

#### Offers
- `GET /api/offers` - Get available offers
- `GET /api/offers/categories` - Get offer categories
- `POST /api/offers/:offerId/start` - Start an offer
- `POST /api/offers/sync` - Sync offers (admin only)

#### Transactions
- `GET /api/transactions/history` - User transaction history
- `POST /api/transactions/withdraw` - Request withdrawal
- `POST /api/transactions/deposit` - Initiate deposit
- `GET /api/transactions/stats` - User statistics

#### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/transactions` - Manage transactions
- `PUT /api/admin/transactions/:id/process` - Process transactions

## 🔧 Configuration

### Ad Network Setup
1. **AdGate Rewards**
   - Sign up at AdGate Rewards
   - Get your API key and configure webhooks
   - Set `ADGATE_API_KEY` in environment

2. **OfferToro**
   - Register with OfferToro
   - Configure API key and webhook URL
   - Set `OFFERTORO_API_KEY` in environment

3. **CPX Research**
   - Set up CPX Research account
   - Configure survey settings
   - Set `CPXRESEARCH_API_KEY` in environment

### Payment Integration
1. **PayPal**
   - Create PayPal developer account
   - Set up application credentials
   - Configure webhook endpoints

2. **Cryptocurrency**
   - Integrate with services like Coinbase Commerce
   - Set up webhook handling for payment confirmations

## 🎨 Customization

### Styling
- Colors and themes can be modified in `client/tailwind.config.js`
- Custom CSS classes are in `client/src/index.css`
- Component styles use Tailwind utility classes

### Branding
- Update logo and branding in `client/src/components/Layout/Header.js`
- Modify site name and metadata in `client/public/index.html`

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- MongoDB injection prevention

## 📊 Monitoring

### Available Logs
- User authentication events
- Transaction processing
- Offer completions
- Admin actions
- API errors and warnings

### Database Indexes
The application includes optimized indexes for:
- User lookups by email/username
- Transaction queries by user and date
- Offer filtering and sorting
- Admin dashboard statistics

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secure_production_secret
```

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas
- **Frontend**: Vercel, Netlify (if separating)
- **CDN**: Cloudflare for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a demonstration project. For production use:
- Implement proper payment processing
- Add comprehensive error handling
- Set up monitoring and logging
- Implement backup strategies
- Add proper rate limiting
- Conduct security audits

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

Built with ❤️ for the Roblox community