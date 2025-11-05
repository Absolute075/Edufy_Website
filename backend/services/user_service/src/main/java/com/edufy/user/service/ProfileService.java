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

    public UserProfile getOrCreate(String username){
        return repo.findByUsername(username).orElseGet(() ->
                repo.save(UserProfile.builder().username(username).build()));
    }

    public UserProfile updateBasics(String username, String phone, String birthDate, String location){
        UserProfile p = getOrCreate(username);
        p.setPhone(phone);
        if (birthDate != null && !birthDate.isBlank()) {
            try { p.setBirthDate(LocalDate.parse(birthDate)); } catch (Exception ignored) {}
        }
        p.setLocation(location);
        return repo.save(p);
    }

    public UserProfile updateAvatarUrl(String username, String avatarUrl){
        UserProfile p = getOrCreate(username);
        p.setAvatarUrl(avatarUrl);
        return repo.save(p);
    }

    public void renameUsername(String oldUsername, String newUsername) {
        if (oldUsername == null || newUsername == null) return;
        if (oldUsername.equals(newUsername)) return;
        // If profile with old username exists, migrate to new username
        repo.findByUsername(oldUsername).ifPresent(p -> {
            // If target exists, do nothing to avoid unique conflict
            if (repo.existsByUsername(newUsername)) return;
            p.setUsername(newUsername);
            repo.save(p);
        });
    }
}
