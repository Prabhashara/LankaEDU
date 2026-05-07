package com.onlineexam.users;

public record PublicUser(
  String id,
  String name,
  String email,
  String role,
  String status,
  boolean isActive
) {
  public static PublicUser from(User user) {
    boolean active = user.isActive();
    return new PublicUser(
      user.getId(),
      user.getName(),
      user.getEmail(),
      user.getRole(),
      active ? "Active" : "Inactive",
      active
    );
  }
}
