# Dependencies Installation Guide

This directory contains automated scripts to install and update all project dependencies for E621 Horizon.

## Available Scripts

### 1. `install-dependencies.bat` (Windows Batch)
Simple batch script for quick dependency installation.

**Usage:**
```cmd
install-dependencies.bat
```

**Features:**
- Checks Node.js and npm installation
- Cleans existing dependencies
- Installs all required packages
- Verifies critical dependencies
- User-friendly colored output

### 2. `install-dependencies.ps1` (PowerShell)
Advanced PowerShell script with enhanced features and error handling.

**Usage:**
```powershell
# Basic installation
.\install-dependencies.ps1

# Force clean installation (no prompts)
.\install-dependencies.ps1 -Force

# Verbose output for debugging
.\install-dependencies.ps1 -Verbose

# Skip global tool installation
.\install-dependencies.ps1 -SkipGlobal

# Combine parameters
.\install-dependencies.ps1 -Force -Verbose -SkipGlobal
```

**Parameters:**
- `-Force`: Automatically removes existing node_modules and package-lock.json without prompting
- `-Verbose`: Enables detailed output for debugging
- `-SkipGlobal`: Skips installation of global development tools

**Features:**
- Comprehensive dependency verification
- Colored output with progress indicators
- Error handling and recovery suggestions
- npm cache management
- Global development tools installation
- Installation time tracking
- Package script enumeration

## Prerequisites

### Required
- **Node.js 18.x or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Windows 10/11** or **Windows Server 2016+**

### Recommended
- **PowerShell 5.1+** (for enhanced script features)
- **Git** (for version control)
- **Administrator privileges** (for global package installation)

## Installation Process

Both scripts follow the same general process:

1. **System Check** - Verifies Node.js and npm installation
2. **npm Update** - Updates npm to the latest version (PowerShell only)
3. **Cache Cleanup** - Clears npm cache to prevent conflicts
4. **Dependency Cleanup** - Removes existing node_modules and package-lock.json
5. **Package Installation** - Installs all dependencies from package.json
6. **Global Tools** - Installs recommended development tools globally
7. **Verification** - Confirms all critical packages are properly installed

## Critical Dependencies

The scripts verify installation of these essential packages:

- **next** - Next.js framework
- **react** & **react-dom** - React library
- **typescript** - TypeScript compiler
- **electron** - Desktop application framework
- **tailwindcss** - CSS framework
- **@radix-ui/react-dialog** - UI components
- **lucide-react** - Icon library

## Global Development Tools

The PowerShell script optionally installs these global tools:

- **typescript** - TypeScript compiler (global)
- **tsx** - TypeScript execution engine
- **@types/node** - Node.js type definitions

## Troubleshooting

### Common Issues

**"Node.js is not installed"**
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Ensure Node.js is added to your system PATH
- Restart your terminal/command prompt

**"Permission denied" or "Access denied"**
- Run the script as Administrator
- Use `npm config set prefix` to change global install location
- Check folder permissions

**"Network timeout" or "Registry errors"**
- Check your internet connection
- Try using a different npm registry: `npm config set registry https://registry.npmjs.org/`
- Clear npm cache: `npm cache clean --force`

**"Module not found" after installation**
- Delete node_modules and package-lock.json
- Run the installation script again with `-Force` parameter
- Verify package.json is present and valid

### Getting Help

If you encounter issues:

1. Run the PowerShell script with `-Verbose` flag for detailed output
2. Check the error messages for specific package names
3. Ensure your Node.js version is 18.x or higher
4. Try running with Administrator privileges

## Manual Installation

If the automated scripts fail, you can install dependencies manually:

```cmd
# Clear cache and clean install
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json
npm install

# Install global tools (optional)
npm install -g typescript tsx @types/node
```

## After Installation

Once dependencies are installed successfully, you can use these commands:

```cmd
# Start development server
npm run dev

# Build for production
npm run build

# Start Electron development
npm run electron-dev

# Build Electron distribution
npm run dist
```

## Updates

To update all dependencies to their latest versions:

```cmd
# Update dependencies
npm update

# Or run the installation script again
.\install-dependencies.ps1 -Force
```

The installation scripts can be run multiple times safely to update or reinstall dependencies as needed.