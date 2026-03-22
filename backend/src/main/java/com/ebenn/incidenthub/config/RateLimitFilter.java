package com.ebenn.incidenthub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

  private final StringRedisTemplate redis;
  private final AtomicBoolean redisUnavailable = new AtomicBoolean(false);

  public RateLimitFilter(StringRedisTemplate redis) { this.redis = redis; }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    String key = "rate:incident:" + request.getRemoteAddr();
    Long count;
    try {
      count = redis.opsForValue().increment(key);
      if (count != null && count == 1) {
        redis.expire(key, Duration.ofSeconds(60));
      }
      if (redisUnavailable.compareAndSet(true, false)) {
        log.info("Redis connection recovered; request rate limiting re-enabled.");
      }
    } catch (RuntimeException ex) {
      if (redisUnavailable.compareAndSet(false, true)) {
        log.warn("Redis unavailable; skipping request rate limiting until Redis recovers.");
      }
      filterChain.doFilter(request, response);
      return;
    }

    if (count != null && count > 100) {
      response.setStatus(429);
      response.getWriter().write("Too Many Requests");
      return;
    }
    filterChain.doFilter(request, response);
  }
}
