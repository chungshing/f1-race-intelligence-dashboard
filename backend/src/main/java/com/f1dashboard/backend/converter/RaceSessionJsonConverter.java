package com.f1dashboard.backend.converter;

import java.util.List;
import com.f1dashboard.backend.model.RaceSession;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;

@Converter
public class RaceSessionJsonConverter extends BaseJsonListConverter<RaceSession> {
    public RaceSessionJsonConverter() {
        super(new TypeReference<List<RaceSession>>() {});
    }
}