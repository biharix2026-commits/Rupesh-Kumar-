# Security Specification for Biharix2026 Portfolio

## Data Invariants
- A creation must have a title, category, imageUrl, and authorId.
- Only authenticated users can create creations.
- Only the author can delete their creations (though for this app, we'll assume the owner is the admin).
- Everyone can read creations.

## The Dirty Dozen Payloads (Rejection Tests)
1. Create creation without title.
2. Create creation without category.
3. Create creation without imageUrl.
4. Create creation with fake authorId.
5. Create creation with fake createdAt (not server timestamp).
6. Update a creation's authorId.
7. Anonymous user creating a creation.
8. Non-admin trying to update authorId.
9. Injecting 1MB string into title.
10. Injecting 1MB string into category.
11. Injecting junk document ID.
12. Deleting a creation by non-owner.
