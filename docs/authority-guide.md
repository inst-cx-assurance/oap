# Authority and separation-of-duties guide

Evidence submitters, Outcome Auditors, and Outcome Directors use different assignments and action permissions. Auditor and Director must be different people; the Auditor must also be separate from evidence delivery. Assignment dates and exact project/Outcome/boundary scope are checked at each action time. Conflict declarations are mandatory for action-bearing roles in the reference semantics and must exist by the action time, remain current, and contain mitigation when marked mitigated.

Delegation links the delegator, delegate, and delegated scope bidirectionally. The delegation scope must fit both assignments, cannot change role type or expand projects, Outcomes, boundaries, actions, or validity, and is applied alongside the delegate assignment scope at every delegated action. It must be active at action time and cannot cycle or bypass separation of duties. These are neutral integrity controls. The final delegation and conflict-review policy requires governance approval.

Human withdrawal, revocation, and supersession acts require applicable Director authority and an actor assignment. A clock may detect expiry after `validTo`, and a system may detect a reassessment trigger; a `system_detection` record must not name a human actor assignment. Neither automated event is a new human decision. Withdrawal or revocation leaves the authorization as the current historical record version but makes it ineffective.

Competence, appointment, conflict, delegation, and `human_supplied` fields record assertions. Technical validation cannot prove their truth, a person's identity, a signature, or legal effectiveness outside the package.
