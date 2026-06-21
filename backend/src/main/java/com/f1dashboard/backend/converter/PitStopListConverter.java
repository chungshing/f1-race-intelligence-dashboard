package com.f1dashboard.backend.converter;

import java.util.List;
import com.f1dashboard.backend.model.PitStop;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;

@Converter
public class PitStopListConverter extends BaseJsonListConverter<PitStop> {
    public PitStopListConverter() {
        super(new TypeReference<List<PitStop>>() {
        });
    }
}