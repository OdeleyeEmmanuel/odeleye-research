# Odeleye Research — Firebase Hosting + Supabase

## Public site
- `index.html` is the public publication.
- CV and Resume download links have been removed from the public publication.
- The navigation contains a small **Author Login ↗** link. It opens `admin.html` on a separate page.
- `article.html?slug=...` displays a published article.
- `comments.html?slug=...` is a separate reader discussion page. Comments are not embedded in the article itself.
- Readers can submit a name, optional email, comment text and an optional JPG/PNG/WebP picture (max 5 MB).
- Submitted comments remain hidden until approved in the private editor.

## Private editor
- `admin.html` is the author/editor page. It is reachable through the **Author Login** link, but it is protected by Supabase Auth.
- A visitor cannot access the publication dashboard without a valid editor account.
- After login you can create drafts, publish articles, edit/delete publications and moderate comments.

## Supabase setup
1. Run `schema.sql` in the Supabase SQL Editor.
2. Create the editor user in Supabase Authentication.
3. Add the editor user's UUID to `public.admin_users`.
4. The SQL creates/configures the `comment-images` Storage bucket and its policies.
5. Keep the `sb_secret_*` key server-side. Only the publishable key belongs in `supabase-config.js`.

## Firebase Hosting
Firebase Hosting is used only to host the website files. Supabase remains the backend for articles, authentication, comments and comment images.

The included `firebase.json` is ready for static Firebase Hosting. From the project folder:

```bash
firebase login
firebase init hosting
firebase deploy --only hosting
```

If Firebase asks for a public directory during `firebase init`, choose the folder containing `index.html`, or keep the existing `firebase.json` and deploy from this project folder. Firebase will provide a `PROJECT_ID.web.app` address.

Your editor will then be available at:

`https://PROJECT_ID.web.app/admin.html`

## Custom domain
Firebase Hosting supports custom domains and automatically provisions SSL. Use Firebase Console → Hosting → Add custom domain, then follow the DNS records Firebase gives you.

## Important security note
The Supabase secret key was previously shared in chat. Rotate/revoke that secret in Supabase and issue a new one. Do not place the replacement secret in this website, GitHub or Firebase Hosting.
