package com.ftehc.ftehc.guardians;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "guardians")
public class Guardian {

    @Id
    private String id;

    private String userId;

    @Builder.Default
    private List<String> studentIds = new ArrayList<>();

    private String relationship;

    // Extended enrollment fields - Guardian name
    private String firstName;

    private String middleName;

    private String lastName;

    private String phone;

    // Spouse information
    private String spouseFirstName;

    private String spouseMiddleName;

    private String spouseLastName;

    // Backward compatibility - computed full name
    private String fullName;

    private String spouseFullName;
}

