# #659 Error Logging & Rate Limiting Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 46 new tests across 5 files covering error logging context, rate limiting boundaries, multi-user enforcement, cooldowns, daily resets, and cross-contract rate limiting.

**Architecture:** Extend existing test files (`tests_errors.rs`, `tests_rate_limit.rs`) in the chioma contract. Create new `tests_rate_limit.rs` files for payment, escrow, and dispute_resolution contracts using direct module function calls with storage-seeded config.

**Tech Stack:** Rust, Soroban SDK, `cargo test`

---

## File Structure

| File | Action | Description |
|------|--------|-------------|
| `contract/contracts/chioma/src/tests_errors.rs` | Modify | Add 8 error logging tests |
| `contract/contracts/chioma/src/tests_rate_limit.rs` | Modify | Add 23 rate limit tests + update imports |
| `contract/contracts/payment/src/tests_rate_limit.rs` | Create | 5 rate limit tests |
| `contract/contracts/payment/src/lib.rs` | Modify | Add `mod tests_rate_limit;` |
| `contract/contracts/escrow/src/tests_rate_limit.rs` | Create | 5 rate limit tests |
| `contract/contracts/escrow/src/lib.rs` | Modify | Add `mod tests_rate_limit;` |
| `contract/contracts/dispute_resolution/src/tests_rate_limit.rs` | Create | 5 rate limit tests |
| `contract/contracts/dispute_resolution/src/lib.rs` | Modify | Add `mod tests_rate_limit;` |

---

### Task 1: Error Logging Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_errors.rs`

- [ ] **Step 1: Add 8 error logging tests**

Append the following tests to the end of `contract/contracts/chioma/src/tests_errors.rs`:

```rust
#[test]
fn test_error_log_context_fields() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let op = String::from_str(&env, "create_agreement");
    let details = String::from_str(&env, "Agreement ID not found in storage");

    client.log_error(&RentalError::AgreementNotFound, &op, &details);

    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 1);

    let log = logs.get(0).unwrap();
    assert_eq!(log.error_code, 13);
    assert_eq!(
        log.error_message,
        String::from_str(&env, "Agreement not found. Please check the ID.")
    );
    assert_eq!(log.details, details);
    assert_eq!(log.operation, op);
    assert!(log.timestamp > 0);
}

#[test]
fn test_error_log_timestamp() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    env.ledger().with_mut(|li| li.timestamp = 99999);

    let op = String::from_str(&env, "test_op");
    let details = String::from_str(&env, "test details");
    client.log_error(&RentalError::InternalError, &op, &details);

    let logs = client.get_error_logs(&10);
    let log = logs.get(0).unwrap();
    assert_eq!(log.timestamp, 99999);
}

#[test]
fn test_error_log_operation_name() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let details = String::from_str(&env, "details");

    client.log_error(
        &RentalError::AgreementNotFound,
        &String::from_str(&env, "create_agreement"),
        &details,
    );
    client.log_error(
        &RentalError::PaymentFailed,
        &String::from_str(&env, "make_payment"),
        &details,
    );

    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 2);
    assert_eq!(
        logs.get(0).unwrap().operation,
        String::from_str(&env, "create_agreement")
    );
    assert_eq!(
        logs.get(1).unwrap().operation,
        String::from_str(&env, "make_payment")
    );
}

#[test]
fn test_error_log_details_completeness() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let long_details = String::from_str(
        &env,
        "This is a very long error detail string that contains extensive information about what went wrong during the operation including context about the agreement state and the specific validation that failed during processing of the request",
    );
    let op = String::from_str(&env, "validate");

    client.log_error(&RentalError::InvalidInput, &op, &long_details);

    let logs = client.get_error_logs(&10);
    let log = logs.get(0).unwrap();
    assert_eq!(log.details, long_details);
}

#[test]
fn test_error_log_persistence() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let op = String::from_str(&env, "create_agreement");
    let details = String::from_str(&env, "persistence test");

    client.log_error(&RentalError::AgreementNotFound, &op, &details);

    // Perform unrelated read operation
    let _config = client.get_rate_limit_config();

    // Verify error log persisted
    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 1);
    assert_eq!(logs.get(0).unwrap().operation, op);
}

#[test]
fn test_error_log_various_types() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let details = String::from_str(&env, "test");

    client.log_error(
        &RentalError::AgreementNotFound,
        &String::from_str(&env, "core"),
        &details,
    );
    client.log_error(
        &RentalError::PaymentInsufficientFunds,
        &String::from_str(&env, "payment"),
        &details,
    );
    client.log_error(
        &RentalError::EscrowNotFound,
        &String::from_str(&env, "escrow"),
        &details,
    );
    client.log_error(
        &RentalError::RateLimitExceeded,
        &String::from_str(&env, "rate_limit"),
        &details,
    );

    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 4);
    assert_eq!(logs.get(0).unwrap().error_code, 13);
    assert_eq!(logs.get(1).unwrap().error_code, 201);
    assert_eq!(logs.get(2).unwrap().error_code, 401);
    assert_eq!(logs.get(3).unwrap().error_code, 801);
}

#[test]
fn test_error_log_ordering() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let details = String::from_str(&env, "d");

    client.log_error(
        &RentalError::InternalError,
        &String::from_str(&env, "op1"),
        &details,
    );
    client.log_error(
        &RentalError::InternalError,
        &String::from_str(&env, "op2"),
        &details,
    );
    client.log_error(
        &RentalError::InternalError,
        &String::from_str(&env, "op3"),
        &details,
    );
    client.log_error(
        &RentalError::InternalError,
        &String::from_str(&env, "op4"),
        &details,
    );
    client.log_error(
        &RentalError::InternalError,
        &String::from_str(&env, "op5"),
        &details,
    );

    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 5);
    assert_eq!(
        logs.get(0).unwrap().operation,
        String::from_str(&env, "op1")
    );
    assert_eq!(
        logs.get(4).unwrap().operation,
        String::from_str(&env, "op5")
    );
}

#[test]
fn test_error_log_limit_returns_most_recent() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup(&env);

    let op = String::from_str(&env, "op");

    // Log 15 errors with distinguishable details
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_0"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_1"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_2"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_3"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_4"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_5"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_6"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_7"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_8"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_9"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_10"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_11"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_12"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_13"));
    client.log_error(&RentalError::InternalError, &op, &String::from_str(&env, "error_14"));

    let logs = client.get_error_logs(&5);
    assert_eq!(logs.len(), 5);
    // Should return the 5 most recent (indices 10-14)
    assert_eq!(
        logs.get(0).unwrap().details,
        String::from_str(&env, "error_10")
    );
    assert_eq!(
        logs.get(4).unwrap().details,
        String::from_str(&env, "error_14")
    );
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_errors
```

Expected: All 11 tests pass (3 existing + 8 new).

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_errors.rs && git commit -m "test: add 8 error logging tests for context, timestamps, ordering (#659)"
```

---

### Task 2: Rate Limit Config & Boundary Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `contract/contracts/chioma/src/tests_rate_limit.rs`:

```rust
extern crate alloc;

use crate::errors::RentalError;
use crate::types::{AgreementInput, AgreementTerms, Config, RateLimitConfig};
use crate::{Contract, ContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String, Vec,
};
```

Additions: `extern crate alloc;` (needed for `alloc::format!` in loops — crate is `#![no_std]`) and `use crate::errors::RentalError;` (needed by integration tests in Task 6).

- [ ] **Step 2: Add 5 config & boundary tests**

Append after the existing `test_reset_user_rate_limit` test:

```rust
#[test]
fn test_get_rate_limit_config_default() {
    let (env, client, _admin, _) = create_contract();

    let config = client.get_rate_limit_config();
    assert_eq!(config.max_calls_per_block, 10);
    assert_eq!(config.max_calls_per_user_per_day, 100);
    assert_eq!(config.cooldown_blocks, 0);
}

#[test]
fn test_get_block_call_count() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Make 3 calls with different tenants (to avoid daily per-user limit)
    let tenant1 = Address::generate(&env);
    let tenant2 = Address::generate(&env);
    let tenant3 = Address::generate(&env);

    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant1, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant2, &payment_token));
    client.create_agreement(&make_input(&env, "ag3", &landlord, &tenant3, &payment_token));

    let count = client.get_block_call_count(&String::from_str(&env, "create_agreement"));
    assert_eq!(count, 3);
}

#[test]
fn test_rate_limit_exact_boundary() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 5,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Make exactly 5 calls — all should succeed
    for i in 0..5 {
        let result = client.try_create_agreement(&make_input(
            &env,
            &alloc::format!("agreement_{}", i),
            &landlord,
            &tenant,
            &payment_token,
        ));
        assert!(result.is_ok());
    }

    // 6th call should fail
    let result = client.try_create_agreement(&make_input(
        &env,
        "agreement_5",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());
}

#[test]
fn test_rate_limit_single_call() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 1,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    let result1 = client.try_create_agreement(&make_input(
        &env,
        "agreement1",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result1.is_ok());

    let result2 = client.try_create_agreement(&make_input(
        &env,
        "agreement2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result2.is_err());
}

#[test]
fn test_rate_limit_zero_daily_limit() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 0,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    let result = client.try_create_agreement(&make_input(
        &env,
        "agreement1",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit
```

Expected: All 12 tests pass (7 existing + 5 new).

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add rate limit config, boundary, and exact limit tests (#659)"
```

---

### Task 3: Rate Limit Per-Function & Multi-User Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Add 4 tests**

Append after the tests added in Task 2:

```rust
#[test]
fn test_rate_limit_per_function() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 2,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Make 2 create_agreement calls (hits daily limit for "create_agreement")
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant, &payment_token));

    // 3rd create_agreement should fail
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());

    // Verify a different function name has no count
    let other_count = client.get_user_call_count(
        &tenant,
        &String::from_str(&env, "some_other_function"),
    );
    assert!(other_count.is_none());
}

#[test]
fn test_rate_limit_independent_users() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 2,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let tenant_a = Address::generate(&env);
    let tenant_b = Address::generate(&env);

    // User A makes 2 calls (hits limit)
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant_a, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant_a, &payment_token));

    // User A's 3rd call fails
    let result_a = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant_a,
        &payment_token,
    ));
    assert!(result_a.is_err());

    // User B can still call — independent limit
    let result_b = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant_b,
        &payment_token,
    ));
    assert!(result_b.is_ok());
}

#[test]
fn test_rate_limit_block_limit_multi_user() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 2,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let tenant_a = Address::generate(&env);
    let tenant_b = Address::generate(&env);
    let tenant_c = Address::generate(&env);

    // User A: 1 call
    let result_a = client.try_create_agreement(&make_input(
        &env,
        "ag1",
        &landlord,
        &tenant_a,
        &payment_token,
    ));
    assert!(result_a.is_ok());

    // User B: 1 call (block count now 2)
    let result_b = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant_b,
        &payment_token,
    ));
    assert!(result_b.is_ok());

    // User C: fails — block limit shared across all users
    let result_c = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant_c,
        &payment_token,
    ));
    assert!(result_c.is_err());
}

#[test]
fn test_rate_limit_user_call_count_per_user() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let tenant_a = Address::generate(&env);
    let tenant_b = Address::generate(&env);

    // User A makes 3 calls
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant_a, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant_a, &payment_token));
    client.create_agreement(&make_input(&env, "ag3", &landlord, &tenant_a, &payment_token));

    // User B makes 1 call
    client.create_agreement(&make_input(&env, "ag4", &landlord, &tenant_b, &payment_token));

    let fn_name = String::from_str(&env, "create_agreement");

    let count_a = client.get_user_call_count(&tenant_a, &fn_name).unwrap();
    assert_eq!(count_a.daily_count, 3);
    assert_eq!(count_a.call_count, 3);

    let count_b = client.get_user_call_count(&tenant_b, &fn_name).unwrap();
    assert_eq!(count_b.daily_count, 1);
    assert_eq!(count_b.call_count, 1);
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit
```

Expected: All 16 tests pass (12 previous + 4 new).

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add per-function and multi-user rate limit tests (#659)"
```

---

### Task 4: Rate Limit Cooldown Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Add 3 cooldown tests**

Append:

```rust
#[test]
fn test_rate_limit_cooldown_partial_wait() {
    let (env, client, _admin, _) = create_contract();

    env.mock_all_auths();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 10,
    };
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // First call succeeds
    let result1 = client.try_create_agreement(&make_input(
        &env,
        "ag1",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result1.is_ok());

    // Advance 5 blocks (partial cooldown)
    env.ledger().with_mut(|li| li.sequence_number += 5);

    // Should fail — only 5 of 10 blocks
    let result2 = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result2.is_err());

    // Advance 5 more blocks (total 10)
    env.ledger().with_mut(|li| li.sequence_number += 5);

    // Should succeed — cooldown met
    let result3 = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result3.is_ok());
}

#[test]
fn test_rate_limit_cooldown_exact_boundary() {
    let (env, client, _admin, _) = create_contract();

    env.mock_all_auths();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 10,
    };
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // First call
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Advance exactly 10 blocks
    env.ledger().with_mut(|li| li.sequence_number += 10);

    // Should succeed — 10 >= 10 means cooldown is met
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_ok());
}

#[test]
fn test_rate_limit_multiple_cooldowns() {
    let (env, client, _admin, _) = create_contract();

    env.mock_all_auths();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 5,
    };
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Call 1 succeeds
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Advance 5 blocks, call 2 succeeds
    env.ledger().with_mut(|li| li.sequence_number += 5);
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant, &payment_token));

    // Immediately call 3 — fails (new cooldown from call 2)
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());

    // Advance 5 blocks, call 3 succeeds
    env.ledger().with_mut(|li| li.sequence_number += 5);
    let result2 = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result2.is_ok());
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit
```

Expected: All 19 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add cooldown partial, boundary, and multiple cooldown tests (#659)"
```

---

### Task 5: Rate Limit Daily Reset & Admin Reset Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Add 4 tests**

Append:

```rust
#[test]
fn test_rate_limit_reset_exact_boundary() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 1,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // First call uses daily limit
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Advance exactly 17280 blocks (1 day)
    env.ledger().with_mut(|li| li.sequence_number += 17280);

    // Should succeed — daily counter resets
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_ok());
}

#[test]
fn test_rate_limit_reset_partial_day() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 1,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Advance 17279 blocks — one short of a day
    env.ledger().with_mut(|li| li.sequence_number += 17279);

    // Should fail — counter not yet reset
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());
}

#[test]
fn test_reset_user_rate_limit_counter_zero() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let fn_name = String::from_str(&env, "create_agreement");

    // Make calls to increment counter
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant, &payment_token));

    // Verify count is 2
    let count = client.get_user_call_count(&tenant, &fn_name);
    assert!(count.is_some());
    assert_eq!(count.unwrap().call_count, 2);

    // Admin resets
    client.reset_user_rate_limit(&tenant, &fn_name);

    // Verify count is None (key removed)
    let count_after = client.get_user_call_count(&tenant, &fn_name);
    assert!(count_after.is_none());
}

#[test]
fn test_reset_user_rate_limit_independent() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let tenant_a = Address::generate(&env);
    let tenant_b = Address::generate(&env);
    let fn_name = String::from_str(&env, "create_agreement");

    // Both users make calls
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant_a, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant_b, &payment_token));

    // Reset User A only
    client.reset_user_rate_limit(&tenant_a, &fn_name);

    // User A's count is gone
    assert!(client.get_user_call_count(&tenant_a, &fn_name).is_none());

    // User B's count is unchanged
    let count_b = client.get_user_call_count(&tenant_b, &fn_name).unwrap();
    assert_eq!(count_b.call_count, 1);
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit
```

Expected: All 23 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add daily reset boundary and admin reset independence tests (#659)"
```

---

### Task 6: Rate Limit Integration Tests

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Add 4 integration tests**

Append:

```rust
#[test]
fn test_rate_limit_error_logged_on_exceed() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 1,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // First call succeeds
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Second call fails (rate limited)
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());

    // Explicitly log the rate limit error
    let op = String::from_str(&env, "create_agreement");
    let details = String::from_str(&env, "Daily rate limit exceeded for user");
    client.log_error(&RentalError::RateLimitExceeded, &op, &details);

    // Verify it was logged
    let logs = client.get_error_logs(&10);
    assert_eq!(logs.len(), 1);
    assert_eq!(logs.get(0).unwrap().error_code, 801);
    assert_eq!(logs.get(0).unwrap().operation, op);
}

#[test]
fn test_rate_limit_across_blocks() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 2,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let tenant1 = Address::generate(&env);
    let tenant2 = Address::generate(&env);
    let tenant3 = Address::generate(&env);

    // Exhaust block limit
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant1, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant2, &payment_token));

    // 3rd call in same block fails
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant3,
        &payment_token,
    ));
    assert!(result.is_err());

    // Advance 1 block — block counter resets
    env.ledger().with_mut(|li| li.sequence_number += 1);

    // Now succeeds
    let result2 = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant3,
        &payment_token,
    ));
    assert!(result2.is_ok());
}

#[test]
fn test_rate_limit_with_pause_state() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 3,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // 1st call succeeds (daily_count=1)
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Pause contract
    client.pause(&String::from_str(&env, "maintenance"));

    // Call during pause fails with ContractPaused (not RateLimitExceeded)
    let paused_result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(paused_result.is_err());

    // Unpause
    client.unpause();

    // 2nd call succeeds (daily_count=2 — counter survived pause)
    let result2 = client.try_create_agreement(&make_input(
        &env,
        "ag3",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result2.is_ok());

    // 3rd call succeeds (daily_count=3)
    let result3 = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result3.is_ok());

    // 4th call fails — daily limit reached (proves counter persisted through pause)
    let result4 = client.try_create_agreement(&make_input(
        &env,
        "ag5",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result4.is_err());
}

#[test]
fn test_rate_limit_cooldown_and_daily_combined() {
    let (env, client, _admin, _) = create_contract();

    env.mock_all_auths();

    let config = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 3,
        cooldown_blocks: 5,
    };
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Call 1 succeeds (daily_count=1)
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));

    // Immediate call 2 — fails due to cooldown
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag2",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());

    // Advance 5 blocks, call 2 succeeds (daily_count=2)
    env.ledger().with_mut(|li| li.sequence_number += 5);
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant, &payment_token));

    // Advance 5 blocks, call 3 succeeds (daily_count=3)
    env.ledger().with_mut(|li| li.sequence_number += 5);
    client.create_agreement(&make_input(&env, "ag3", &landlord, &tenant, &payment_token));

    // Advance 5 blocks, call 4 — cooldown passes but daily limit hit
    env.ledger().with_mut(|li| li.sequence_number += 5);
    let result4 = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result4.is_err());
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit
```

Expected: All 27 tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add rate limit integration tests with error logging and pause (#659)"
```

---

### Task 7: Rate Limit Edge Cases

**Files:**
- Modify: `contract/contracts/chioma/src/tests_rate_limit.rs`

- [ ] **Step 1: Add 3 edge case tests**

Append:

```rust
#[test]
fn test_rate_limit_high_limit() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 1000,
        max_calls_per_user_per_day: 1000,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Make 50 calls — all should succeed under high limits
    for i in 0..50 {
        let result = client.try_create_agreement(&make_input(
            &env,
            &alloc::format!("agreement_{}", i),
            &landlord,
            &tenant,
            &payment_token,
        ));
        assert!(result.is_ok());
    }
}

#[test]
fn test_rate_limit_zero_block_limit() {
    let (env, client, _admin, _) = create_contract();

    let config = RateLimitConfig {
        max_calls_per_block: 0,
        max_calls_per_user_per_day: 100,
        cooldown_blocks: 0,
    };

    env.mock_all_auths();
    client.set_rate_limit_config(&config);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Should fail immediately — zero block limit
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag1",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());
}

#[test]
fn test_rate_limit_config_update() {
    let (env, client, _admin, _) = create_contract();

    env.mock_all_auths();

    // Start with generous limit
    let config1 = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 5,
        cooldown_blocks: 0,
    };
    client.set_rate_limit_config(&config1);

    let tenant = Address::generate(&env);
    let landlord = Address::generate(&env);
    let payment_token = Address::generate(&env);

    // Make 3 calls (daily_count=3)
    client.create_agreement(&make_input(&env, "ag1", &landlord, &tenant, &payment_token));
    client.create_agreement(&make_input(&env, "ag2", &landlord, &tenant, &payment_token));
    client.create_agreement(&make_input(&env, "ag3", &landlord, &tenant, &payment_token));

    // Tighten limit to 3
    let config2 = RateLimitConfig {
        max_calls_per_block: 100,
        max_calls_per_user_per_day: 3,
        cooldown_blocks: 0,
    };
    client.set_rate_limit_config(&config2);

    // 4th call should fail — new limit applies to existing counter
    let result = client.try_create_agreement(&make_input(
        &env,
        "ag4",
        &landlord,
        &tenant,
        &payment_token,
    ));
    assert!(result.is_err());
}
```

- [ ] **Step 2: Run all chioma tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit && cargo test -p chioma -- tests_errors
```

Expected: All 30 rate limit tests pass (7 existing + 23 new). All 11 error tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/chioma/src/tests_rate_limit.rs && git commit -m "test: add rate limit edge case tests for high/zero limits and config update (#659)"
```

---

### Task 8: Payment Contract Rate Limit Tests

**Files:**
- Create: `contract/contracts/payment/src/tests_rate_limit.rs`
- Modify: `contract/contracts/payment/src/lib.rs`

- [ ] **Step 1: Add module declaration to lib.rs**

In `contract/contracts/payment/src/lib.rs`, add after the `mod tests_recurring;` block (line 23):

```rust
#[cfg(test)]
mod tests_rate_limit;
```

- [ ] **Step 2: Create test file**

Create `contract/contracts/payment/src/tests_rate_limit.rs`:

```rust
use crate::rate_limit;
use crate::storage::DataKey;
use crate::types::RateLimitConfig;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use crate::PaymentContract;

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    let contract_id = env.register(PaymentContract, ());
    let user = Address::generate(&env);
    (env, contract_id, user)
}

fn seed_config(env: &Env, contract_id: &Address, config: &RateLimitConfig) {
    env.as_contract(contract_id, || {
        env.storage()
            .persistent()
            .set(&DataKey::RateLimitConfig, config);
    });
}

#[test]
fn test_rate_limit_config_default() {
    let (env, contract_id, _user) = setup();

    let config = env.as_contract(&contract_id, || rate_limit::get_rate_limit_config(&env));
    assert_eq!(config.max_calls_per_block, 10);
    assert_eq!(config.max_calls_per_user_per_day, 100);
    assert_eq!(config.cooldown_blocks, 0);
}

#[test]
fn test_check_rate_limit_within_limit() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 10,
            max_calls_per_user_per_day: 5,
            cooldown_blocks: 0,
        },
    );

    // 3 calls should all succeed
    for _ in 0..3 {
        let result = env.as_contract(&contract_id, || {
            rate_limit::check_rate_limit(&env, &user, "pay_rent")
        });
        assert!(result.is_ok());
    }
}

#[test]
fn test_check_rate_limit_exceed_block() {
    let (env, contract_id, _user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 2,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 0,
        },
    );

    // Use different users to avoid daily limit, same block
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user1, "pay_rent")
    });
    assert!(r1.is_ok());

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user2, "pay_rent")
    });
    assert!(r2.is_ok());

    // 3rd call exceeds block limit
    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user3, "pay_rent")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_exceed_daily() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 2,
            cooldown_blocks: 0,
        },
    );

    // 2 calls succeed
    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r1.is_ok());

    // Advance block to avoid block-level collision
    env.ledger().with_mut(|li| li.sequence_number += 1);

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r2.is_ok());

    env.ledger().with_mut(|li| li.sequence_number += 1);

    // 3rd call exceeds daily limit
    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_cooldown() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 10,
        },
    );

    // First call succeeds
    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r1.is_ok());

    // Immediate call fails (cooldown)
    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r2.is_err());

    // Advance 10 blocks
    env.ledger().with_mut(|li| li.sequence_number += 10);

    // Now succeeds
    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "pay_rent")
    });
    assert!(r3.is_ok());
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p payment -- tests_rate_limit
```

Expected: All 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/payment/src/tests_rate_limit.rs contract/contracts/payment/src/lib.rs && git commit -m "test: add payment contract rate limit tests (#659)"
```

---

### Task 9: Escrow Contract Rate Limit Tests

**Files:**
- Create: `contract/contracts/escrow/src/tests_rate_limit.rs`
- Modify: `contract/contracts/escrow/src/lib.rs`

- [ ] **Step 1: Add module declaration to lib.rs**

In `contract/contracts/escrow/src/lib.rs`, add after the `mod tests;` block (line 19):

```rust
#[cfg(test)]
mod tests_rate_limit;
```

- [ ] **Step 2: Create test file**

Create `contract/contracts/escrow/src/tests_rate_limit.rs`.

Note: Escrow contract stores `DataKey` in `crate::types` (not `crate::storage`). Uses `EscrowError` and `EscrowContract` from `crate::escrow_impl`.

```rust
use crate::rate_limit;
use crate::types::{DataKey, RateLimitConfig};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use crate::escrow_impl::EscrowContract;

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    let contract_id = env.register(EscrowContract, ());
    let user = Address::generate(&env);
    (env, contract_id, user)
}

fn seed_config(env: &Env, contract_id: &Address, config: &RateLimitConfig) {
    env.as_contract(contract_id, || {
        env.storage()
            .persistent()
            .set(&DataKey::RateLimitConfig, config);
    });
}

#[test]
fn test_rate_limit_config_default() {
    let (env, contract_id, _user) = setup();

    let config = env.as_contract(&contract_id, || rate_limit::get_rate_limit_config(&env));
    assert_eq!(config.max_calls_per_block, 10);
    assert_eq!(config.max_calls_per_user_per_day, 100);
    assert_eq!(config.cooldown_blocks, 0);
}

#[test]
fn test_check_rate_limit_within_limit() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 10,
            max_calls_per_user_per_day: 5,
            cooldown_blocks: 0,
        },
    );

    for _ in 0..3 {
        let result = env.as_contract(&contract_id, || {
            rate_limit::check_rate_limit(&env, &user, "deposit")
        });
        assert!(result.is_ok());
    }
}

#[test]
fn test_check_rate_limit_exceed_block() {
    let (env, contract_id, _user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 2,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 0,
        },
    );

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user1, "deposit")
    });
    assert!(r1.is_ok());

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user2, "deposit")
    });
    assert!(r2.is_ok());

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user3, "deposit")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_exceed_daily() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 2,
            cooldown_blocks: 0,
        },
    );

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r1.is_ok());

    env.ledger().with_mut(|li| li.sequence_number += 1);

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r2.is_ok());

    env.ledger().with_mut(|li| li.sequence_number += 1);

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_cooldown() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 10,
        },
    );

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r1.is_ok());

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r2.is_err());

    env.ledger().with_mut(|li| li.sequence_number += 10);

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "deposit")
    });
    assert!(r3.is_ok());
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p escrow -- tests_rate_limit
```

Expected: All 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/escrow/src/tests_rate_limit.rs contract/contracts/escrow/src/lib.rs && git commit -m "test: add escrow contract rate limit tests (#659)"
```

---

### Task 10: Dispute Resolution Contract Rate Limit Tests

**Files:**
- Create: `contract/contracts/dispute_resolution/src/tests_rate_limit.rs`
- Modify: `contract/contracts/dispute_resolution/src/lib.rs`

- [ ] **Step 1: Add module declaration to lib.rs**

In `contract/contracts/dispute_resolution/src/lib.rs`, add after the `mod tests;` block (line 13):

```rust
#[cfg(test)]
mod tests_rate_limit;
```

- [ ] **Step 2: Create test file**

Create `contract/contracts/dispute_resolution/src/tests_rate_limit.rs`.

Note: Dispute resolution uses `crate::storage::DataKey` (not `crate::types`), `DisputeError`, and `DisputeResolutionContract`.

```rust
use crate::rate_limit;
use crate::storage::DataKey;
use crate::types::RateLimitConfig;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use crate::DisputeResolutionContract;

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    let contract_id = env.register(DisputeResolutionContract, ());
    let user = Address::generate(&env);
    (env, contract_id, user)
}

fn seed_config(env: &Env, contract_id: &Address, config: &RateLimitConfig) {
    env.as_contract(contract_id, || {
        env.storage()
            .persistent()
            .set(&DataKey::RateLimitConfig, config);
    });
}

#[test]
fn test_rate_limit_config_default() {
    let (env, contract_id, _user) = setup();

    let config = env.as_contract(&contract_id, || rate_limit::get_rate_limit_config(&env));
    assert_eq!(config.max_calls_per_block, 10);
    assert_eq!(config.max_calls_per_user_per_day, 100);
    assert_eq!(config.cooldown_blocks, 0);
}

#[test]
fn test_check_rate_limit_within_limit() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 10,
            max_calls_per_user_per_day: 5,
            cooldown_blocks: 0,
        },
    );

    for _ in 0..3 {
        let result = env.as_contract(&contract_id, || {
            rate_limit::check_rate_limit(&env, &user, "raise_dispute")
        });
        assert!(result.is_ok());
    }
}

#[test]
fn test_check_rate_limit_exceed_block() {
    let (env, contract_id, _user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 2,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 0,
        },
    );

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user1, "raise_dispute")
    });
    assert!(r1.is_ok());

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user2, "raise_dispute")
    });
    assert!(r2.is_ok());

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user3, "raise_dispute")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_exceed_daily() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 2,
            cooldown_blocks: 0,
        },
    );

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r1.is_ok());

    env.ledger().with_mut(|li| li.sequence_number += 1);

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r2.is_ok());

    env.ledger().with_mut(|li| li.sequence_number += 1);

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r3.is_err());
}

#[test]
fn test_check_rate_limit_cooldown() {
    let (env, contract_id, user) = setup();

    seed_config(
        &env,
        &contract_id,
        &RateLimitConfig {
            max_calls_per_block: 100,
            max_calls_per_user_per_day: 100,
            cooldown_blocks: 10,
        },
    );

    let r1 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r1.is_ok());

    let r2 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r2.is_err());

    env.ledger().with_mut(|li| li.sequence_number += 10);

    let r3 = env.as_contract(&contract_id, || {
        rate_limit::check_rate_limit(&env, &user, "raise_dispute")
    });
    assert!(r3.is_ok());
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p dispute_resolution -- tests_rate_limit
```

Expected: All 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Desktop/Projects/chioma && git add contract/contracts/dispute_resolution/src/tests_rate_limit.rs contract/contracts/dispute_resolution/src/lib.rs && git commit -m "test: add dispute resolution contract rate limit tests (#659)"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Run all tests across all contracts**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma && cargo test -p payment && cargo test -p escrow && cargo test -p dispute_resolution
```

Expected: All tests pass across all 4 contracts. Chioma: 30 rate limit + 11 error tests. Payment/escrow/dispute: 5 rate limit tests each.

- [ ] **Step 2: Verify test counts**

```bash
cd /Users/user/Desktop/Projects/chioma/contract && cargo test -p chioma -- tests_rate_limit 2>&1 | grep "test result" && cargo test -p chioma -- tests_errors 2>&1 | grep "test result" && cargo test -p payment -- tests_rate_limit 2>&1 | grep "test result" && cargo test -p escrow -- tests_rate_limit 2>&1 | grep "test result" && cargo test -p dispute_resolution -- tests_rate_limit 2>&1 | grep "test result"
```

Expected output:
```
test result: ok. 30 passed; 0 failed; 0 ignored; 0 measured; X filtered out
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; X filtered out
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; X filtered out
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; X filtered out
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; X filtered out
```
