package com.zuantan.dismantling;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.zuantan.dismantling.mapper")
@EnableScheduling
public class DismantlingApplication {

    public static void main(String[] args) {
        SpringApplication.run(DismantlingApplication.class, args);
    }
}
