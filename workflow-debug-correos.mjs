export const meta = {
    name: 'debug-correos-clinica',
    description: 'Debug de envío de correos en clinica dental',
    phases: [
        { title: 'Root Cause Investigation' },
        { title: 'Pattern Analysis' },
        { title: 'Hypothesis and Testing' },
        { title: 'Implementation' }
    ]
};

phase('Root Cause Investigation')
await agent('check environment variables', {schema: ENV_SCHEMA})
await agent('verify Resend config in booking.ts and contact.ts', {schema: CODE_SCHEMA})
await agent('check email templates in email.ts', {schema: CODE_SCHEMA})
await agent('reproduce email sending issue', {schema: REPRODUCE_SCHEMA})

phase('Pattern Analysis')
await agent('find similar email sending cases', {schema: FIND_SIMILAR_SCHEMA})
await agent('compare booking and contact email templates', {schema: COMPARE_SCHEMA})
await agent('analyze patterns in code', {schema: ANALYZE_PATTERN_SCHEMA})

phase('Hypothesis and Testing')
await agent('form hypothesis about root cause', {schema: HYPOTHESIS_SCHEMA})
await agent('test hypothesis with minimal change', {schema: TEST_HYPOTHESIS_SCHEMA})
await agent('verify fix works', {schema: VERIFY_FIX_SCHEMA})

phase('Implementation')
await agent('implement fix', {schema: IMPLEMENT_FIX_SCHEMA})
await agent('add failing test case', {schema: ADD_TEST_SCHEMA})
await agent('final verification', {schema: FINAL_VERIFY_SCHEMA})