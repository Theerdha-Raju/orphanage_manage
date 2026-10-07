/**
 * childAuth.js
 * ============
 * Centralized utility for resolving and locking individual child identity
 * across child-accessible portal views (My Learning, Health Record, AI Growth Path, etc.)
 */

export function getLoggedInChild(children) {
  if (!Array.isArray(children) || children.length === 0) return null;

  const childId   = localStorage.getItem('childId');
  const userId    = localStorage.getItem('userId');
  const userName  = (localStorage.getItem('userName') || '').trim().toLowerCase();
  const userEmail = (localStorage.getItem('userEmail') || '').trim().toLowerCase();

  let matched = null;

  // 1. By stored childId
  if (childId) {
    matched = children.find(c => String(c.child_id) === String(childId));
  }

  // 2. By child.user_id match
  if (!matched && userId) {
    matched = children.find(c => String(c.user_id) === String(userId));
  }

  // 3. By exact full_name match
  if (!matched && userName) {
    matched = children.find(c => c.full_name && c.full_name.trim().toLowerCase() === userName);
  }

  // 4. By email or email username match
  if (!matched && userEmail) {
    matched = children.find(c => c.email && c.email.trim().toLowerCase() === userEmail);
    if (!matched) {
      const prefix = userEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
      matched = children.find(c => c.full_name && c.full_name.trim().toLowerCase() === prefix);
    }
  }

  // 5. By first name match
  if (!matched && userName) {
    const firstName = userName.split(' ')[0];
    if (firstName.length >= 2) {
      matched = children.find(c => c.full_name && c.full_name.trim().toLowerCase().startsWith(firstName));
    }
  }

  // 6. By child_id === userId fallback
  if (!matched && userId) {
    matched = children.find(c => String(c.child_id) === String(userId));
  }

  // 7. Default to first child
  if (!matched) {
    matched = children[0] || null;
  }

  // Cache resolved childId for seamless page-to-page navigation
  if (matched && matched.child_id) {
    localStorage.setItem('childId', String(matched.child_id));
  }

  return matched;
}
