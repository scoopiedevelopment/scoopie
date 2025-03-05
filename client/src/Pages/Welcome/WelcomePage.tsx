import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  GitBranch, 
  Package, 
  Pocket as Docker, 
  PenTool as Tool, 
  Database,
  Github,
  ExternalLink,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getServerStatus } from '../../services/api.services';
import { Feature, ServerStatus } from '../../types/types';

const WelcomePage: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getServerStatus();
        setStatus(response);
      } catch (err) {
        setError('Failed to fetch server status.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Auto-refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const features: Feature[] = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "Modern Stack",
      description: "Node.js, React, and TypeScript pre-configured for full-stack development",
      details: "Built with the latest versions of Node.js, React 18, and TypeScript 5.0+"
    },
    {
      icon: <Docker className="w-6 h-6" />,
      title: "Docker Ready",
      description: "Containerized setup with Docker and Docker Compose",
      details: "Multi-stage builds, development and production configurations included"
    },
    {
      icon: <Tool className="w-6 h-6" />,
      title: "Dev Tools",
      description: "ESLint, Prettier, Husky, and Commitlint pre-configured",
      details: "Consistent code style and commit messages across your team"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "MongoDB Ready",
      description: "Pre-configured database setup with MongoDB",
      details: "Includes Mongoose ODM with TypeScript support and example schemas"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "2-Service Architecture",
      description: "Server and Clientservices ready to go",
      details: "Microservices architecture with shared types and utilities"
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Version Control",
      description: "Git workflow with conventional commits",
      details: "Includes PR templates and GitHub Actions workflows"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0B1120]">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000" />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto space-y-12"
          >
            {/* Enhanced Hero Section */}
            <motion.div 
              className="text-center space-y-6"
              variants={itemVariants}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative inline-block"
              >
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2">
                  Project Initialization Kit
                </h1>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transform scale-x-0 animate-expandWidth" />
              </motion.div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                A comprehensive development toolkit with Node.js, React, TypeScript, MongoDB, and Docker.
                Start your project with best practices and modern tooling.
              </p>
              {/* Quick Stats */}
              <div className="flex justify-center gap-8 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Production Ready</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Github className="w-4 h-4" />
                  <span>MIT License</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <Package className="w-4 h-4" />
                  <span>Regular Updates</span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Features Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                  className="group relative p-6 bg-gray-900/40 backdrop-blur-lg rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-purple-400 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-100">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    <AnimatePresence>
                      {activeFeature === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-700/50"
                        >
                          <p className="text-gray-300 text-sm">{feature.details}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              className="flex flex-col md:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/manishdashsharma"
                target="_blank"
                rel="noopener noreferrer"
                className="relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold text-center shadow-lg overflow-hidden group flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Github className="w-5 h-5" />
                <span className="relative">View on GitHub</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
              
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/manishdashsharma/project-setup-toolkit/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="relative px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full font-semibold shadow-lg overflow-hidden group flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Documentation</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Enhanced System Status */}
            <AnimatePresence>
              {status && (
                <motion.div 
                  variants={itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative p-6 bg-gray-900/40 backdrop-blur-lg rounded-xl border border-gray-700/50 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-100">System Status</h3>
                    <div className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative">
                    <div>
                      <p className="text-gray-400">Environment: <span className="text-green-400">{status.data.application.environment}</span></p>
                      <p className="text-gray-400">Uptime: <span className="text-green-400">{status.data.application.uptime}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-400">Memory Usage: <span className="text-green-400">{status.data.application.memoryUsage.heapUsed}</span></p>
                      <p className="text-gray-400">CPU Usage: <span className="text-green-400">{status.data.system.cpuUsage[0].toFixed(2)}%</span></p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-2 justify-center text-red-400 text-center p-4 bg-red-500/10 rounded-lg backdrop-blur-sm"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}

            {/* Enhanced Footer */}
            <motion.div 
              variants={itemVariants}
              className="text-center text-gray-400 text-sm space-y-2"
            >
              <p>Created with ❤️ by{' '}
                <a 
                  href="https://www.linkedin.com/in/manish-dash-sharma-0082b8185/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors duration-300 flex items-center gap-1 justify-center"
                >
                  Manish Dash Sharma
                  <ExternalLink className="w-4 h-4" />
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;