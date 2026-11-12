package com.jewelleryshop.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.jewelleryshop.service.StateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Small REST API used by the browser frontend.
 * GET reads the saved shop data; PUT saves updated shop data.
 */
@RestController
@RequestMapping("/api")
public class StateController {

    private final StateService stateService;

    public StateController(StateService stateService) {
        this.stateService = stateService;
    }

    @GetMapping("/state")
    public ResponseEntity<?> getState() {
        JsonNode state = stateService.loadState();
        // An empty JSON object tells the frontend to use its included demo records.
        return state == null ? ResponseEntity.ok(Map.of()) : ResponseEntity.ok(state);
    }

    @PutMapping("/state")
    public ResponseEntity<String> saveState(@RequestBody JsonNode state) {
        stateService.saveState(state);
        return ResponseEntity.ok("Shop data saved successfully.");
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Jewellery Shop backend is running.");
    }
}
