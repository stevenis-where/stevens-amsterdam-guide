# Steven's Amsterdam

A personal Amsterdam city guide.

## Routes

- `/` - Steven's Amsterdam city guide

The static site is structured to support future event editions at `/events/{event-slug}/`. It is public and link-shareable, but asks search engines not to index or archive it through page metadata, `robots.txt`, and Vercel response headers.

## Local Preview

Serve the project directory with any static file server. For example:

```sh
python3 -m http.server 4174
```

Then open `http://127.0.0.1:4174/`.

## Deployment

The project is configured for zero-build static deployment on Vercel. Image credits and source links are documented in `IMAGE_CREDITS.md`.
