package com.f1dashboard.backend.converter;

import java.util.List;
import com.f1dashboard.backend.model.StartingGridEntry;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.Converter;

@Converter
public class StartingGridListConverter extends BaseJsonListConverter<StartingGridEntry> {
    public StartingGridListConverter() {
        super(new TypeReference<List<StartingGridEntry>>() {
        });
    }
}