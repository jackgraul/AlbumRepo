package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.User;
import com.example.AlbumRepo.Repository.IUserRepository;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class UserService extends OidcUserService {
    private final IUserRepository userRepository;

    public UserService(IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {

        // Complete Google's normal user-loading process first.
        OidcUser oidcUser = super.loadUser(userRequest);

        // Extract the user's Google account information.
        String googleId = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String displayName = oidcUser.getFullName();

        // Look for an existing application user.
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(User::new);

        // Populate or update their application profile.
        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setDisplayName(displayName);

        userRepository.save(user);

        // Return the authenticated Google user to Spring Security.
        return oidcUser;
    }
}