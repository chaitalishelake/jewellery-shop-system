package com.jewelleryshop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Handles permanent storage of the frontend application state in MySQL.
 */
@Service
public class StateService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public StateService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public JsonNode loadState() {
        return jdbcTemplate.query(
            "SELECT state_json FROM app_state WHERE id = 1",
            resultSet -> {
                if (!resultSet.next()) {
                    return null;
                }
                String json = resultSet.getString("state_json");
                try {
                    return objectMapper.readTree(json);
                } catch (Exception exception) {
                    throw new IllegalStateException("Saved shop data is not valid JSON.", exception);
                }
            }
        );
    }

    public void saveState(JsonNode state) {
        try {
            String json = objectMapper.writeValueAsString(state);
            jdbcTemplate.update(
                "INSERT INTO app_state (id, state_json) VALUES (1, ?) " +
                "ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP",
                json
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Could not save shop data.", exception);
        }
    }
}
