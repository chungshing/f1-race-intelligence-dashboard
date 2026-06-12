package com.f1dashboard.backend.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1dashboard.backend.model.DriverResult;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class DriverResultListConverter implements AttributeConverter<List<DriverResult>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<DriverResult> attribute) {
        if (attribute == null)
            return "[]";
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Override
    public List<DriverResult> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty())
            return new ArrayList<>();
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<DriverResult>>() {
            });
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }
}