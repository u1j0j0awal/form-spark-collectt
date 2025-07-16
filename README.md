# Feedback Collection Platform

A full-stack feedback collection platform built with React, TypeScript, and Supabase. This platform allows businesses to create custom feedback forms and collect responses from their customers.

## Features

### Admin/Business Features
- **User Authentication**: Secure sign-up and sign-in for admins
- **Form Builder**: Create custom feedback forms with various question types:
  - Text input questions
  - Multiple choice questions
  - Required/optional question settings
- **Form Management**: 
  - Activate/deactivate forms
  - Copy shareable public links
  - View form statistics
- **Response Dashboard**: 
  - View all responses in a tabular format
  - Export responses to CSV
  - Real-time response statistics
  - Summary views with response counts

### Customer/User Features
- **Public Form Access**: Submit feedback via public URLs without authentication
- **Mobile Responsive**: Optimized for all device sizes
- **User-Friendly Interface**: Clean, intuitive form submission experience

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui component library
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions)
- **Routing**: React Router v6
- **State Management**: React Context (Auth) + React Query
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## Database Schema

The platform uses a normalized PostgreSQL schema with the following tables:

- **profiles**: User profile information
- **forms**: Feedback form metadata
- **form_questions**: Individual questions within forms
- **form_responses**: Form submission records
- **question_responses**: Individual answers to questions

All tables implement Row Level Security (RLS) for data protection.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd feedback-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - The database schema will be automatically created when you first run the application
   - No manual database setup required - the app includes automated migrations

4. **Configure Authentication**
   - In your Supabase dashboard, go to Authentication > Settings
   - Set the Site URL to your development URL (e.g., `http://localhost:5173`)
   - Add redirect URLs for production deployment

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Admin interface: `http://localhost:5173`
   - Public forms: `http://localhost:5173/form/{form-id}` (after creating a form)

## Usage Guide

### For Admins

1. **Sign Up/Sign In**: Create an account or sign in to access the dashboard
2. **Create Forms**: Use the form builder to create feedback forms with custom questions
3. **Share Forms**: Copy the public link and share it with your customers
4. **View Responses**: Monitor submissions in real-time and export data as CSV

### For Customers

1. **Access Form**: Visit the public form link provided by the business
2. **Submit Feedback**: Fill out the form questions and submit your response
3. **Confirmation**: Receive confirmation of successful submission

## Design Decisions

### Architecture
- **Component-based**: Modular React components for maintainability
- **Type Safety**: Full TypeScript implementation for robust development
- **Real-time Updates**: Supabase subscriptions for live response tracking
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Security
- **Row Level Security**: Database-level security policies
- **Authentication Required**: Admin features protected by authentication
- **Public Access**: Forms accessible without authentication for user convenience
- **Data Validation**: Both frontend and database-level validation

### User Experience
- **Intuitive Navigation**: Clear separation between admin and public interfaces
- **Loading States**: Smooth user experience with loading indicators
- **Error Handling**: Comprehensive error messages and validation
- **Mobile Optimization**: Responsive design for all screen sizes

## Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform** (Vercel, Netlify, etc.)

3. **Update Supabase settings**
   - Add your production domain to Site URL
   - Add production domain to redirect URLs

## API Endpoints

The platform uses Supabase's auto-generated REST API:

- **Forms**: CRUD operations for feedback forms
- **Questions**: Manage form questions and options
- **Responses**: Handle form submissions and retrieval
- **Authentication**: User registration and login

## Project URL


## How to Edit

You can edit this project in several ways:

- **Use Lovable**: Visit the project URL and start prompting
- **Local Development**: Clone the repo and run `npm run dev`
- **GitHub Codespaces**: Use the online development environment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Future Enhancements

- **Analytics Dashboard**: Advanced charts and insights
- **Email Notifications**: Automated response notifications
- **Form Templates**: Pre-built form templates for common use cases
- **Advanced Question Types**: File uploads, rating scales, date pickers
- **Team Collaboration**: Multiple admin users per organization
- **API Access**: REST API for integrations

## License

This project is licensed under the MIT License - see the LICENSE file for details.