# Production Deployment Guide

## Overview
This guide covers deploying the ReelAI application to production environments.

## Prerequisites
- Firebase project with Blaze (pay-as-you-go) plan
- Google Cloud Platform account
- Flutter release signing keys
- Domain name (for custom URLs)

## Step 1: Backend Deployment

### FastAPI Backend Setup
1. Set up Google Cloud Run:
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
gcloud init

# Configure Docker
gcloud auth configure-docker
```

2. Build and deploy backend:
```bash
# Build Docker image
docker build -t gcr.io/[PROJECT_ID]/reel-ai-backend .

# Push to Container Registry
docker push gcr.io/[PROJECT_ID]/reel-ai-backend

# Deploy to Cloud Run
gcloud run deploy reel-ai-backend \
  --image gcr.io/[PROJECT_ID]/reel-ai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Configuration
1. Set production environment variables:
```bash
gcloud run services update reel-ai-backend \
  --set-env-vars="FIREBASE_PROJECT_ID=[PROJECT_ID]" \
  --set-env-vars="FIREBASE_PRIVATE_KEY=[KEY]"
```

## Step 2: Firebase Deployment

### Security Rules Deployment
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### Functions Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:processVideo
```

### Configure Custom Domain
1. Add custom domain in Firebase Console
2. Update DNS records
3. Verify domain ownership
4. Wait for SSL certificate provisioning

## Step 3: Flutter App Release

### Android Release
1. Create signing key:
```bash
keytool -genkey -v -keystore release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release
```

2. Configure signing:
   - Create `key.properties` in android folder
   ```properties
   storePassword=<password>
   keyPassword=<password>
   keyAlias=release
   storeFile=release-key.jks
   ```

3. Build release APK:
```bash
flutter build apk --release
```

4. Upload to Play Store:
   - Create release
   - Upload APK
   - Fill store listing
   - Submit for review

### iOS Release (Future)
1. Set up certificates in Apple Developer Portal
2. Configure signing in Xcode
3. Build IPA:
```bash
flutter build ips --release
```
4. Upload to App Store Connect

## Step 4: Production Checks

### Security Verification
- [ ] Firebase Security Rules tested
- [ ] API endpoints secured
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] App signing verified

### Performance Checks
- [ ] Load testing completed
- [ ] CDN configured
- [ ] Database indexes created
- [ ] API latency verified
- [ ] App startup time optimized

### Monitoring Setup
1. Configure Firebase Monitoring:
   - Enable Crashlytics
   - Set up Performance Monitoring
   - Configure Analytics

2. Set up API monitoring:
   - Enable Cloud Monitoring
   - Set up alerts
   - Configure logging

3. Database monitoring:
   - Set up quota alerts
   - Monitor query performance
   - Configure backups

## Step 5: Post-Deployment

### Verify Deployment
1. Test all critical paths:
   - User authentication
   - Video upload
   - Video playback
   - Social features

2. Check analytics:
   - User engagement
   - Error rates
   - Performance metrics

### Documentation Updates
1. Update API documentation
2. Update user guides
3. Document known issues

### Rollback Plan
1. Keep previous version tagged
2. Document rollback procedures:
```bash
# Rollback backend
gcloud run services rollback reel-ai-backend

# Rollback Firebase
firebase hosting:rollback

# Rollback app version in stores
```

## Production Maintenance

### Regular Tasks
1. Monitor system health:
   - Check error rates
   - Review performance metrics
   - Monitor costs

2. Database maintenance:
   - Review indexes
   - Optimize queries
   - Manage data retention

3. Security updates:
   - Update dependencies
   - Review security rules
   - Monitor auth patterns

### Scaling Considerations
- Configure auto-scaling
- Monitor resource usage
- Plan capacity increases

## Troubleshooting

### Common Issues
1. Deployment failures:
   - Check build logs
   - Verify environment variables
   - Check service account permissions

2. Performance issues:
   - Review Cloud Run metrics
   - Check Firebase quotas
   - Monitor database performance

3. App store rejections:
   - Review guidelines
   - Check content policies
   - Verify privacy requirements

### Support Channels
- Firebase Support
- Google Cloud Support
- GitHub Issues
- Stack Overflow 