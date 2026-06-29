package com.f1dashboard.backend.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class LapId implements Serializable {
    private int sessionKey;
    private int driverNumber;
    private int lapNumber;
}