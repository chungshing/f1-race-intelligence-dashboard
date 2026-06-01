package com.f1dashboard.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OpenF1DriverDto {

    @JsonProperty("driver_number")
    private int driverNumber;

    @JsonProperty("broadcast_name")
    private String broadcastName;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("name_acronym")
    private String nameAcronym;

    @JsonProperty("team_name")
    private String teamName;

    @JsonProperty("team_colour")
    private String teamColour;

    @JsonProperty("headshot_url")
    private String headshotUrl;
}