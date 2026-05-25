# Regear Security Specification

## Data Invariants
1. A Gear listing must have a valid `sellerId` matching the creator's UID.
2. A Chat can only be accessed by its `participants`.
3. A Review can only be created by a user who is not the seller (buyer).
4. `createdAt` and `ownerId`/`sellerId` fields are immutable.
5. All price fields must be positive numbers.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Creating a Gear listing with someone else's `sellerId`.
2. Updating a Gear listing price as a non-owner.
3. Reading someone else's private messages.
4. Posting a comment as an unauthenticated user.
5. Deleting a User profile that isn't yours.
6. Injecting a massive string (1MB) into the Gear `title`.
7. Creating a Chat where you aren't one of the `participants`.
8. Updating a Gear `createdAt` timestamp.
9. Setting `isVerified` to true on your own profile.
10. Creating a Gear listing with a negative price.
11. Reading the entire `users` collection as a list without filters.
12. Updating a Message after it's been sent.
