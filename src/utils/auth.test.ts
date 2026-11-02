import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_USERS } from '../data/initialData.ts';
import { User } from '../types/index.ts';

// Authentication verification helper matching LoginScreen logic
function authenticateUser(
  usernameInput: string,
  passwordInput: string,
  users: User[]
): { success: boolean; error?: string; user?: User } {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  let targetUser: User | undefined;
  const isAdminAlias =
    cleanUser === 'kgc\\aag1000972' ||
    cleanUser === 'aag1000972' ||
    cleanUser === 'admin' ||
    cleanUser === 'amesh.gadugale@kirloskar.com';

  if (isAdminAlias) {
    targetUser = users.find(u => u.username === 'admin') || INITIAL_USERS[0];
  } else if (cleanUser === 'engineer' || cleanUser === 'r.kulkarni@kirloskar.com') {
    targetUser = users.find(u => u.username === 'engineer') || INITIAL_USERS[1];
  } else {
    targetUser = users.find(
      u =>
        u.username.toLowerCase() === cleanUser ||
        u.email.toLowerCase() === cleanUser
    );
  }

  if (!targetUser) {
    return { success: false, error: 'User not recognized' };
  }

  if (targetUser.active === false) {
    return { success: false, error: 'Account is deactivated' };
  }

  const expectedPassword =
    targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'user123');

  if (cleanPass !== expectedPassword) {
    return { success: false, error: 'Incorrect password. Password protection enabled.' };
  }

  return { success: true, user: targetUser };
}

test('Password protection: correct credentials authenticate successfully', () => {
  // Test admin with employee ID
  const res1 = authenticateUser('kgc\\aag1000972', 'admin123', INITIAL_USERS);
  assert.equal(res1.success, true);
  assert.equal(res1.user?.role, 'admin');

  // Test admin with plain username
  const res2 = authenticateUser('admin', 'admin123', INITIAL_USERS);
  assert.equal(res2.success, true);

  // Test engineer
  const res3 = authenticateUser('engineer', 'user123', INITIAL_USERS);
  assert.equal(res3.success, true);
  assert.equal(res3.user?.role, 'engineer');
});

test('Password protection: incorrect password is strictly rejected', () => {
  // Wrong password for admin
  const res1 = authenticateUser('kgc\\aag1000972', 'wrongpass', INITIAL_USERS);
  assert.equal(res1.success, false);
  assert.ok(res1.error?.includes('Incorrect password'));

  // Wrong password for engineer
  const res2 = authenticateUser('engineer', '1234', INITIAL_USERS);
  assert.equal(res2.success, false);
  assert.ok(res2.error?.includes('Incorrect password'));

  // Empty password
  const res3 = authenticateUser('admin', '', INITIAL_USERS);
  assert.equal(res3.success, false);
});

test('Password protection: non-existent user is strictly rejected', () => {
  const res = authenticateUser('unknown_hacker', 'admin123', INITIAL_USERS);
  assert.equal(res.success, false);
  assert.equal(res.error, 'User not recognized');
});
