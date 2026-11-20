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
const checkEnvironment = await agent('check environment variables', {schema: ENV_SCHEMA})
const verifyResendConfig = await agent('verify Resend config in booking.ts and contact.ts', {schema: CODE_SCHEMA})
const checkEmailTemplates = await agent('check email templates in email.ts', {schema: CODE_SCHEMA})
const reproduceIssue = await agent('reproduce email sending issue', {schema: REPRODUCE_SCHEMA})

phase('Pattern Analysis')
const findSimilarCases = await agent('find similar email sending cases', {schema: FIND_SIMILAR_SCHEMA})
const compareTemplates = await agent('compare booking and contact email templates', {schema: COMPARE_SCHEMA})
const analyzePatterns = await agent('analyze patterns in code', {schema: ANALYZE_PATTERN_SCHEMA})

phase('Hypothesis and Testing')
const formHypothesis = await agent('form hypothesis about root cause', {schema: HYPOTHESIS_SCHEMA})
const testHypothesis = await agent('test hypothesis with minimal change', {schema: TEST_HYPOTHESIS_SCHEMA})
const verifyFix = await agent('verify fix works', {schema: VERIFY_FIX_SCHEMA})

phase('Implementation')
const implementFix = await agent('implement fix', {schema: IMPLEMENT_FIX_SCHEMA})
const addTests = await agent('add failing test case', {schema: ADD_TEST_SCHEMA})
const finalVerify = await agent('final verification', {schema: FINAL_VERIFY_SCHEMA})