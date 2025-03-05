# Project Initialization Kit Tool

A production-ready development template featuring TypeScript, React, Node.js, and MongoDB, all orchestrated with Docker. This template emphasizes best practices, modern tooling, and developer experience to help you kickstart your projects with enterprise-grade configuration.

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: MongoDB
- **Containerization**: Docker & Docker Compose
- **Code Quality**: ESLint, Prettier
- **Git Hooks**: Husky with Commitlint
- **Development**: Hot-reloading for both frontend and backend

## ✨ Features

- **Containerized Development**: Consistent development environment across teams
- **Type Safety**: Full TypeScript support across the stack
- **Modern Tooling**: Latest stable versions of React, Node.js, and supporting libraries
- **Code Quality**: Automated linting and formatting on commit
- **Conventional Commits**: Standardized commit messages for better collaboration
- **Development Ready**: Pre-configured development and production environments

## 🛠 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git
- Node.js 18+ (for local development outside Docker)

### Installation

1. **Clone the Template**
   ```bash
   git clone https://github.com/manishdashsharma/project-setup-starter.git your-project-name
   cd your-project-name
   ```

2. **Initialize Your Project**
   ```bash
   # Remove existing Git history
   rm -rf .git
   
   # Initialize new Git repository
   git init
   git remote add origin your-repository-url
   ```

3. **Configure Environment**
   ```bash
   # Copy environment templates
   cp .env.example .env.development
   cp .env.example .env.production
   
   # Set execute permissions for the setup script
   chmod +x docker-manager.sh
   ```

4. **Launch Your Stack**
   ```bash
   ./docker-manager.sh your-project-name
   ```

### Running Your Application

The setup script provides an interactive menu to manage your development environment:

```bash
./docker-manager.sh
```

Select from the following options:
1. Launch all services (fresh start)
2. Start backend server only
3. Start frontend client only
4. Start both server and client

## 🌐 Accessing Your Applications

After startup, your applications will be available at:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1/self](http://localhost:5000/api/v1/self)

## 📁 Project Structure

```
your-project-name/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── docker-compose.dev.yml  # Development container configuration
├── docker-compose.prod.yml # Production container configuration
├── .env.development       # Development environment variables
├── .env.production        # Production environment variables
└── docker-manager.sh      # Management script
```

## 🛠 Development Workflow

1. **Start Development Environment**
   ```bash
   ./docker-manager.sh
   # Select development environment and desired services
   ```

2. **Code Changes**
   - Frontend and backend feature hot-reloading
   - ESLint and Prettier run automatically on save
   - Git hooks enforce code quality and commit message standards

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Husky runs pre-commit hooks automatically
   ```

## 🚀 Deployment

1. **Build Production Images**
   ```bash
   ./docker-manager.sh
   # Select production environment and clean start
   ```

2. **Environment Configuration**
   - Update `.env.production` with your production values
   - Ensure all sensitive data is properly secured

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/manishdashsharma/project-setup-toolkit/blob/main/LICENSE) file for details.

## 🙏 Acknowledgments

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [MongoDB](https://www.mongodb.com/)

## 📫 Support

If you find this template helpful, please consider:
- Starring the repository
- Reporting issues
- Contributing improvements

For questions and support, please open an issue in the GitHub repository.