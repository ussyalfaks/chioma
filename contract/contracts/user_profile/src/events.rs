use soroban_sdk::{symbol_short, Address, Bytes, Env, Symbol};
use crate::types::AccountType;

/// Profile created event
pub fn profile_created(env: &Env, account_id: Address, account_type: AccountType, data_hash: Bytes) {
    let topics = (symbol_short!("profile"), symbol_short!("created"), account_id);
    env.events().publish(topics, (account_type, data_hash));
}

/// Profile updated event
pub fn profile_updated(env: &Env, account_id: Address, account_type: AccountType, data_hash: Bytes) {
    let topics = (symbol_short!("profile"), symbol_short!("updated"), account_id);
    env.events().publish(topics, (account_type, data_hash));
}

/// Profile verified event
pub fn profile_verified(env: &Env, account_id: Address) {
    let topics = (symbol_short!("profile"), symbol_short!("verified"), account_id);
    env.events().publish(topics, ());
}

/// Profile unverified event
pub fn profile_unverified(env: &Env, account_id: Address) {
    let topics = (
        symbol_short!("profile"),
        Symbol::new(env, "unverified"),
        account_id,
    );
    env.events().publish(topics, ());
}

/// Profile deleted event
pub fn profile_deleted(env: &Env, account_id: Address) {
    let topics = (symbol_short!("profile"), symbol_short!("deleted"), account_id);
    env.events().publish(topics, ());
}

/// Contract initialized event
pub fn initialized(env: &Env, admin: Address) {
    let topics = (symbol_short!("init"), admin);
    env.events().publish(topics, ());
}
