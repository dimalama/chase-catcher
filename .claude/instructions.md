# ChaseCatcher - Claude Code Instructions

## Project-Specific Guidelines

### Code Style
- Follow the existing ESLint configuration in config/.eslintrc.json
- Use single quotes for strings (except when double quotes are enclosed in single quotes)
- Format code with Prettier before committing
- Maintain consistent indentation and spacing

### Chrome Extension Best Practices
- Always test changes in Chrome with the extension loaded in developer mode
- Be mindful of Manifest V3 requirements and limitations
- Ensure content scripts don't interfere with Chase.com functionality
- Keep the extension lightweight and performant

### Testing Requirements
- Write tests for new functionality in src/__tests__/
- Use Jest with jsdom for DOM-related tests
- Maintain test coverage above 80%
- Run tests before committing changes

### Development Workflow
1. Make changes to source files in src/js/
2. Run `npm run lint:fix` to fix linting issues
3. Run `npm run format` to format code
4. Run `npm test` to verify tests pass
5. Run `npm run build` to create a production build
6. Test the extension manually in Chrome
7. Commit changes with clear, descriptive messages

### Security Considerations
- Never add external API calls or data collection
- Maintain privacy-first approach
- Only interact with Chase.com domains
- Be careful with DOM manipulation to avoid breaking Chase.com functionality

### Git Workflow
- Work on feature branches (e.g., claude/feature-name)
- Write clear commit messages following conventional commits style
- Push changes to the designated branch
- Create pull requests with detailed descriptions

### Common Tasks
- `/test` - Run the test suite
- `/build` - Build the extension
- `/lint` - Check code quality
- `/package` - Create distribution package

### Debugging Tips
- Use Chrome DevTools for debugging content scripts
- Check the extension's background service worker logs
- Test on actual Chase.com offer pages
- Use console.log statements sparingly and remove before committing

### Files to Avoid Modifying
- package-lock.json (unless updating dependencies)
- babel.config.js (stable configuration)
- LICENSE (MIT license)

### When Adding Features
1. Discuss the feature requirements first
2. Plan the implementation approach
3. Consider impact on performance and user experience
4. Add appropriate tests
5. Update documentation if needed
6. Test thoroughly before committing
