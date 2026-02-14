# Questions for Luis - Portfolio Rebuild

## General Questions

1. **Domain & Branding**
   - The site uses "LG" as the navbar logo and "Luis Gimenez" branding. Is this acceptable, or would you prefer a different logo/brand presentation?

2. **Analytics**
   - The old site used Google Analytics 4 (react-ga4). Should we add GA4 tracking to the new site? If so, what's your Measurement ID?

3. **Content Verification**
   - The About/Work pages contain projects like Churnistic, VAULT, Parrish Local, BuilderPlug. Are these all current and accurate?
   - Should we add any other projects or remove any?

## AI Chat Questions

4. **Gemini API Key**
   - Please add `GEMINI_API_KEY` as a GitHub Secret for the CI/CD pipeline
   - Also add to environment variables for local development

5. **AI Chat Behavior**
   - The system prompt includes your background. Would you like any specific tone or personality adjustments?
   - Any specific topics the AI should avoid discussing?

## Infrastructure Questions

6. **GCP Project**
   - What's your GCP Project ID for deployment?
   - Should we use a specific service account, or create a new one?
   - What's your preferred GCP region? (Currently set to us-central1)

7. **Supabase (Optional)**
   - Do you want to set up the RAG pipeline with Supabase pgvector?
   - This would give the AI more accurate, dynamic responses based on your content

## Deployment Questions

8. **Custom Domain**
   - The site will deploy to Cloud Run's default URL initially
   - Do you want to configure a custom domain (gimenez.dev) in GCP?

9. **GitHub Secrets to Add**
   - `GCP_PROJECT_ID` - Your GCP project ID
   - `GCP_SA_KEY` - Service account JSON key
   - `GEMINI_API_KEY` - Gemini API key

## Content Questions

10. **Project Descriptions**
    - Current projects listed: Churnistic, VAULT, Parrish Local, BuilderPlug
    - Any additional details or links to update for these?

11. **Resume/CV**
    - Should we add a downloadable resume/CV to the site?

12. **Blog/Articles**
    - Would you like a blog section for technical articles?

## Design Questions

13. **Color Scheme**
    - Currently using: black background, cyan (#22d3ee) accent
    - Any color preferences to change?

14. **Typography**
    - Using Inter font from Google Fonts
    - Any font preferences?

## Post-Launch

15. **Monitoring**
    - Should we add error tracking (Sentry, LogRocket)?
    - Any uptime monitoring preferences?

16. **Future Enhancements**
    - Any features you'd like to add post-launch?
    - Examples: Dark/light mode toggle, language localization, newsletter signup

---

## Setup Checklist for You

- [ ] Add GitHub Secrets (GCP_PROJECT_ID, GCP_SA_KEY, GEMINI_API_KEY)
- [ ] Configure GCP Cloud Run domain mapping for gimenez.dev
- [ ] (Optional) Set up Supabase project for RAG
- [ ] (Optional) Add Google Analytics Measurement ID
- [ ] Review all content for accuracy
- [ ] Test AI chat responses
- [ ] Verify all project links work

---

## Notes

- The site builds successfully with zero errors
- All content pages are implemented: Home, About, Work, Contact, Chat
- AI chat works with Gemini API (requires API key)
- RAG pipeline scaffolded but optional (requires Supabase)
- Terraform IaC ready for GCP Cloud Run
- GitHub Actions CI/CD configured
- Dockerfile for containerization complete

Once you add the GitHub secrets, pushing to main will automatically deploy to Cloud Run!
