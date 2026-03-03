---
description: A data-driven, network-safe modular attachment framework
  for Source SDK 2013
layout: ../../layouts/ProjectLayout.astro
tags:
- C++
- Source SDK 2013
- Gameplay Systems
- Networking
title: Modular Weapon Attachment System
---

# Modular Weapon Attachment System

A data-driven modular weapon attachment framework built in **C++ for
Source SDK 2013**, designed to support deterministic stat aggregation,
network-safe replication, and runtime extensibility without subclass
explosion.

This system restructures the traditional static weapon architecture into
a composable, entity-based modifier framework.

------------------------------------------------------------------------

## Problem & Constraints

The default Source SDK weapon model tightly couples behavior and
configuration to concrete weapon classes. Customization typically
requires subclassing or hardcoding values, leading to:

-   Class proliferation (e.g., `Weapon_AK47_Silenced_Scoped_ExtMag`)
-   Poor runtime flexibility
-   Increased maintenance complexity
-   Fragile multiplayer prediction behavior

The goal was to design a system that:

-   Supports multiple simultaneous attachments
-   Allows runtime stat modification
-   Maintains deterministic client/server parity
-   Avoids behavioral override spaghetti
-   Remains compatible with Source's networking model

------------------------------------------------------------------------

## Core Architecture

Instead of subclassing weapons per configuration, the system uses
**composition**.

Each weapon instance owns a map of attachment entities stored in a
`UtlMap` keyed by attachment type:

``` cpp
DEFINE_UTLMAP(m_Attachments, FIELD_INTEGER, FIELD_CLASSPTR)
```

This structure provides:

-   Fast lookup by attachment type
-   Type-based uniqueness
-   Clean aggregation iteration
-   Scalable attachment categories

Attachments are full entity classes derived from
`CBaseWeaponAttachment`, not simple data structs.

------------------------------------------------------------------------

## Constructor-Based Configuration Model

Attachments configure weapon behavior through constructor initialization
and networked modifier fields rather than virtual method overrides.

Example (Silencer):

``` cpp
SetAttachmentType(ATTACHMENT_SILENCER);
SetDamageModifier(0.9f);
SetSpreadModifier(0.8f);
SetFireSound("Weapon_Silenced.Fire");
```

Modifiers are stored in network-replicated members:

``` cpp
CNetworkVar(float, m_flDamageModifier);
CNetworkVar(float, m_flFireRateModifier);
CNetworkVar(float, m_flSpreadModifier);
CNetworkString(m_szFireSound, MAX_PATH);
```

This design ensures:

-   Deterministic behavior across client and server
-   No behavioral branching inside attachment subclasses
-   Predictable aggregation model
-   Clean separation of concerns

Attachments remain passive configuration modules. The weapon class
remains responsible for applying final resolved behavior.

------------------------------------------------------------------------

## Data-Driven Attachment Scripts

Attachments load configuration dynamically from KeyValues scripts:

``` cpp
AtchData.Damage = kv->GetFloat("damage_modifier", 1.0f);
AtchData.FireRate = kv->GetFloat("firerate_modifier", 1.0f);
AtchData.Spread = kv->GetFloat("spread_modifier", 1.0f);

AtchData.VM_offset_forward = kv->GetFloat("ads_offset_forward", 0.0f);
AtchData.VM_offset_right   = kv->GetFloat("ads_offset_right", 0.0f);
AtchData.VM_offset_up      = kv->GetFloat("ads_offset_up", 0.0f);
```

This enables:

-   Designer-driven balancing
-   Runtime tuning without recompilation
-   Visual ADS offset configuration
-   Spread and recoil tuning

------------------------------------------------------------------------

## Runtime Stat Aggregation

Base weapon stats remain immutable.

Effective values are computed dynamically inside the weapon:

``` cpp
float totalDamage = GetBaseDamage();

FOR_EACH_MAP(m_Attachments, i)
{
    totalDamage *= m_Attachments[i]->GetDamageModifier();
}
```

Fire sound resolution:

``` cpp
const char* fireSound = pAttachment->GetFireSound();
```

This centralized resolution model guarantees:

-   Reversible attachment behavior
-   No stat mutation corruption
-   Identical aggregation on client and server
-   Deterministic multiplayer prediction

------------------------------------------------------------------------

## Compatibility Filtering

Attachments maintain a list of compatible weapon classes:

``` cpp
CUtlVector<const char*> m_CompatibleWeapons;
```

Compatibility is checked at runtime to prevent invalid attachment
combinations. This ensures structural integrity and prevents mismatched
configurations.

------------------------------------------------------------------------

## Visual & Entity Integration

Attachments are full `CBaseAnimating` entities and:

-   Precache their models
-   Integrate with bone merge systems
-   Participate in client rendering
-   Support custom lighting origins
-   Maintain viewmodel offset data

They are not just logical modifiers but fully integrated visual
components.

------------------------------------------------------------------------

## Networking & Prediction Safety

Because Source Engine relies heavily on client-side prediction,
attachment state must remain synchronized.

Networked fields ensure modifier consistency:

``` cpp
CNetworkVar(float, m_flDamageModifier);
CNetworkVar(float, m_flFireRateModifier);
CNetworkVar(float, m_flSpreadModifier);
CNetworkString(m_szFireSound, MAX_PATH);
```

This guarantees:

-   Deterministic aggregation logic
-   No client/server divergence
-   Stable lag compensation behavior
-   Predictable fire parameter resolution

All effective behavior is computed centrally within the weapon using
replicated attachment data.

------------------------------------------------------------------------

## Factory & Registration System

Attachments self-register using a factory macro:

``` cpp
REGISTER_ATTACHMENT_CLASS(CAttachment_Silencer, ATTACHMENT_SILENCER)
```

This system:

-   Maps attachment type to creation function
-   Avoids large switch statements
-   Supports dynamic instantiation
-   Enables save/restore reconstruction

Save/restore helpers:

``` cpp
void SaveWeaponAttachments(CSave& save, CUtlVector<CBaseWeaponAttachment*>& attachments);
void RestoreWeaponAttachments(CRestore& restore, CUtlVector<CBaseWeaponAttachment*>& attachments);
```

This ensures persistence across game sessions.

------------------------------------------------------------------------

## Design Principles

-   Composition over inheritance
-   Centralized behavior resolution
-   Aggregation over mutation
-   Data-driven configuration
-   Deterministic multiplayer safety
-   Factory-based extensibility

------------------------------------------------------------------------

## Summary

The Modular Weapon Attachment System transforms the static Source SDK
2013 weapon architecture into a scalable, network-safe, data-driven
framework.

By combining:

-   Constructor-based configuration
-   NetworkVar replication
-   Runtime aggregation
-   Factory registration
-   Entity-level integration

the system enables advanced gameplay customization while preserving
Source Engine prediction integrity and architectural cleanliness.
