package com.osmech.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatStatusResponse {

    private boolean aiEnabled;
    private boolean apiConfigured;
    private boolean externalAvailable;
    private String mode;
    private String provider;
    private String model;
    private String officeName;
    private String plan;
    private List<String> capabilities;
}
