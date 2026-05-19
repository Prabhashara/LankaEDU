package com.onlineexam.config;

import com.onlineexam.common.DatabaseSupport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConfig {
  public DatabaseConfig(@Value("${app.database-url:}") String databaseUrl) {
    DatabaseSupport.configureDatabaseUrl(databaseUrl);
  }
}
