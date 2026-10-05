-- Verified against the archived D1 export and the published registry.
-- Historical /posts/kh-impl-collection now redirects to this stable identity.
UPDATE comments SET post_id = 'content-e2dad5985089d006433f464d'
WHERE post_id = 'kh-impl-collection';
UPDATE likes SET post_id = 'content-e2dad5985089d006433f464d'
WHERE post_id = 'kh-impl-collection';
