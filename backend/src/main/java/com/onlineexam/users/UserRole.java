package com.onlineexam.users;

import java.util.Set;

public final class UserRole {
  public static final String ADMIN = "admin";
  public static final String LECTURER = "lecturer";
  public static final String STUDENT = "student";

  private static final Set<String> VALID_ROLES = Set.of(ADMIN, LECTURER, STUDENT);
  private static final Set<String> STAFF_ROLES = Set.of(ADMIN, LECTURER);

  private UserRole() {
  }

  public static String normalize(String role) {
    return role == null ? "" : role.trim().toLowerCase();
  }

  public static boolean isValid(String role) {
    return VALID_ROLES.contains(normalize(role));
  }

  public static boolean isStaffRole(String role) {
    return STAFF_ROLES.contains(normalize(role));
  }

  public static Set<String> validRoles() {
    return VALID_ROLES;
  }

  public static Set<String> staffRoles() {
    return STAFF_ROLES;
  }
}
