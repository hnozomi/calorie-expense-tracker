#!/bin/sh
# Detect test-weakening patterns that require explicit human approval.
# Rationale: docs/testing/test-integrity-rationale.md
# Rules:     CLAUDE.md "Test Integrity"
#
# Flagged patterns:
#   .skip( / .todo( / .fixme( / xit( / xdescribe(  -> disabled tests
#   .only(                                          -> silently skips every other test
#   toBeTruthy() / toBeFalsy()                      -> weakened assertions
#
# Legitimate exceptions must carry the same-line marker:
#   // integrity-allow: <reason>

PATTERN='\.skip\(|\.only\(|\.todo\(|\.fixme\(|toBeTruthy\(\)|toBeFalsy\(\)|xit\(|xdescribe\('

HITS=$(grep -rnE "$PATTERN" src/__tests__ e2e --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'integrity-allow:')

if [ -n "$HITS" ]; then
  echo "✗ Test-integrity check failed. The following need explicit approval"
  echo "  (or an '// integrity-allow: <reason>' marker with a real justification):"
  echo ""
  echo "$HITS"
  exit 1
fi

echo "✓ Test-integrity check passed"
