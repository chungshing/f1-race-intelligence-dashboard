package com.f1dashboard.backend.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1dashboard.backend.model.RaceSession;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class RaceSessionJsonConverter implements AttributeConverter<List<RaceSession>, String> {

    // Reusing a single static mapper instance avoids high allocation overhead
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<RaceSession> attribute) {
        if (attribute == null)
            return "[]";
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Override
    public List<RaceSession> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty())
            return new ArrayList<>();
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<RaceSession>>() {
            });
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }
}