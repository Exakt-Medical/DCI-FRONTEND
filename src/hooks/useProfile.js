// /src/hooks/useProfile.js

import { useState, useEffect, useCallback } from "react";
import { profileService } from "../services/profileService";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = async (profileData) => {
    setUpdating(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile(profileData);
      setProfile(updated);
      return { success: true, data: updated };
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Change password
  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword,
  ) => {
    setUpdating(true);
    setError(null);
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return { success: true, message: "Password changed successfully" };
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    setUpdating(true);
    try {
      const result = await profileService.uploadAvatar(file);
      // Refresh profile to get new avatar URL
      await fetchProfile();
      return { success: true, avatarUrl: result.avatarUrl };
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updating,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
};
