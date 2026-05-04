# Gate Keeper - GitHub Pages Website

This is the official website for Gate Keeper, hosted on GitHub Pages.

## 🌐 Live Website

The website is automatically deployed to GitHub Pages at: `https://jhderojasUVa.github.io/gate-keeper/`

## 📁 Project Structure

```
gh-pages/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions deployment workflow
├── website/
│   ├── public/
│   │   └── shield.svg         # Logo/icon
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Navigation.jsx # Top navigation bar
│   │   │   ├── Hero.jsx       # Hero section with terminal demo
│   │   │   ├── Features.jsx   # Features grid
│   │   │   ├── HowItWorks.jsx # Step-by-step guide
│   │   │   ├── UseCases.jsx   # Use cases for different team sizes
│   │   │   ├── Installation.jsx # Installation guide
│   │   │   └── Footer.jsx     # Footer with links
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # Global styles
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Base styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Vite configuration
│   └── README.md
├── .nojekyll                  # Tells GitHub Pages not to use Jekyll
└── README.md                  # This file
```

## 🎨 Design Philosophy

The website was designed with developers in mind:

- **Dark Theme**: Easy on the eyes, matches developer tools
- **Code-Focused**: Terminal animations, code blocks, and technical language
- **Performance First**: Built with Vite for fast loading
- **Responsive**: Works on all devices from mobile to desktop
- **Clear CTAs**: Easy to find installation and documentation

## 🚀 Local Development

To run the website locally:

```bash
# Navigate to website directory
cd website

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

The website is automatically deployed when you push to the `gh-pages` branch:

1. Push changes to `gh-pages` branch
2. GitHub Actions workflow runs automatically
3. Builds the React app
4. Deploys to GitHub Pages

### Manual Deployment

If you need to deploy manually:

```bash
# Make sure you're on gh-pages branch
git checkout gh-pages

# Make your changes to the website
cd website
# ... edit files ...

# Build the website
npm run build

# Commit and push
git add .
git commit -m "chore: update website"
git push origin gh-pages
```

## 🔧 Customization

### Updating Content

1. **Hero Section**: Edit `website/src/components/Hero.jsx`
2. **Features**: Edit `website/src/components/Features.jsx`
3. **Use Cases**: Edit `website/src/components/UseCases.jsx`
4. **Installation Guide**: Edit `website/src/components/Installation.jsx`

### Styling

- Global styles: `website/src/App.css`
- Component styles: Each component has its own `.css` file
- Color scheme: Defined in CSS variables in `App.css`

### Configuration

Update `website/vite.config.js` if you need to change:
- Base URL path
- Build output directory
- Vite plugins

## 🎯 Key Features

1. **Animated Terminal**: Shows real-time validation demo
2. **Smooth Scrolling**: Navigation links scroll to sections
3. **Copy to Clipboard**: Installation commands have copy buttons
4. **Hover Effects**: Interactive cards and buttons
5. **Gradient Accents**: Modern visual design
6. **SEO Optimized**: Meta tags and semantic HTML

## 📊 Sections

1. **Navigation**: Fixed header with smooth scroll links
2. **Hero**: Eye-catching title with terminal animation
3. **Features**: 6 key features in card grid
4. **How It Works**: 4-step installation process
5. **Use Cases**: Benefits for small teams, enterprises, and open source
6. **Installation**: Detailed setup guide with commands
7. **Footer**: Links to resources and social media

## 🌟 Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **CSS3**: Modern styling with variables and gradients
- **GitHub Actions**: CI/CD pipeline
- **GitHub Pages**: Hosting

## 📝 Contributing

To contribute to the website:

1. Switch to `gh-pages` branch
2. Make your changes in the `website/` directory
3. Test locally with `npm run dev`
4. Commit and push to trigger automatic deployment

## 🐛 Troubleshooting

**Website not updating after push?**
- Check GitHub Actions tab for deployment status
- Ensure Pages is enabled in repository settings
- Verify Pages source is set to GitHub Actions

**404 errors for assets?**
- Check `base` setting in `vite.config.js` matches your repository name
- Ensure assets are in `public/` or imported in components

**Build failing?**
- Check Node.js version (requires v20+)
- Run `npm ci` to clean install dependencies
- Check workflow logs in GitHub Actions

## 📄 License

Apache-2.0 - Same as the main Gate Keeper project

## 👤 Author

Jesus Angel Hernandez de Rojas
- GitHub: [@jhderojasUVa](https://github.com/jhderojasUVa)
