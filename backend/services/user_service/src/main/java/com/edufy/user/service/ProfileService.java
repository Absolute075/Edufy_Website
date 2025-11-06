package com.edufy.user.service;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.domain.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository repo;

    public UserProfile find(String username){
        return repo.findByUsername(username).orElse(null);
    }

    public UserProfile getOrCreate(String username){
        return repo.findByUsername(username).orElseGet(() ->
                repo.save(UserProfile.builder().username(username).build()));
    }

    public UserProfile updateBasics(String username, String phone, String birthDate, String location){
        // Update existing only to avoid creating duplicates during rename race
        UserProfile p = find(username);
        if (p == null) return null;
        p.setPhone(phone);
        if (birthDate != null && !birthDate.isBlank()) {
            try { p.setBirthDate(LocalDate.parse(birthDate)); } catch (Exception ignored) {}
        }
        return repo.save(p);
    }

    public UserProfile updateAvatarUrl(String username, String avatarUrl){
        // Update existing only to avoid creating duplicates during rename race
        UserProfile p = find(username);
        if (p == null) return null;
        p.setAvatarUrl(avatarUrl);
        return repo.save(p);
    }

    public void renameUsername(String oldUsername, String newUsername) {
        if (oldUsername == null || newUsername == null) return;
        if (oldUsername.equals(newUsername)) return;
        var oldOpt = repo.findByUsername(oldUsername);
        if (oldOpt.isEmpty()) return;
        var oldP = oldOpt.get();
        var newOpt = repo.findByUsername(newUsername);
        if (newOpt.isPresent()) {
            // Merge old into new (prefer non-null values already present in new)
            var newP = newOpt.get();
            if (newP.getPhone() == null) newP.setPhone(oldP.getPhone());
            if (newP.getBirthDate() == null) newP.setBirthDate(oldP.getBirthDate());
            if (newP.getAvatarUrl() == null) newP.setAvatarUrl(oldP.getAvatarUrl());
            repo.save(newP);
            // Delete old duplicate
            repo.delete(oldP);
        } else {
            // Simple rename
            oldP.setUsername(newUsername);
            repo.save(oldP);
        }
    }
}
