# Saved property searches

On Search Results, choose a location, rent/buy preference, budget and bedrooms,
then tap **Save this search**. Sign-in is required. The search is stored on the
account and is also available on the website.

Open **Saved searches** from Search Results or the Saved tab. **View results**
restores the location, filters, keyword and sort order. **Remove** deletes only
the selected search after confirmation. Repeated saves of the same criteria
return the existing saved search.

This feature saves search preferences; it does not enable automatic alerts.

The backend migration and `/api/saved-searches` endpoints must be deployed
before releasing the mobile UI. The 18 November 2026 OTA compatibility check
did not match the latest installed Android or iOS runtime, so distribute this
feature in a new production app build. Do not override runtime fingerprints.
