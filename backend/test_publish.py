import requests

session = requests.Session()
login_res = session.post("http://localhost:8000/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
print("Login status:", login_res.status_code)
if login_res.status_code == 200:
    print(login_res.json())

payload = {
  "slug": "test-admin-publish",
  "status": "published",
  "category_id": None,
  "featured_image_id": None,
  "references": [],
  "translations": [
    {
      "language": "en",
      "title": "Test Admin Publish",
      "slug": "test-admin-publish",
      "excerpt": "Excerpt",
      "content": "Content",
      "seo_title": "",
      "seo_description": "",
      "focus_keyword": "",
      "canonical_url": "",
      "allow_index": True,
      "allow_follow": True
    },
    {
      "language": "fr",
      "title": "Test Admin Publish FR",
      "slug": "test-admin-publish-fr",
      "excerpt": "Excerpt FR",
      "content": "Content FR",
      "seo_title": "",
      "seo_description": "",
      "focus_keyword": "",
      "canonical_url": "",
      "allow_index": True,
      "allow_follow": True
    }
  ]
}

res = session.post("http://localhost:8000/api/v1/admin/posts/", json=payload)
print("Create post status:", res.status_code)
print(res.text)
