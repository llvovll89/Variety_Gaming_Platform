import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * 린트는 타입 검사가 잡지 못하는 것만 본다. 타입은 이미 `npm run build`의 tsc가 본다.
 *
 * 규칙을 고르는 기준은 "틀리면 조용히 잘못 도는가"다. 취향에 가까운 규칙(따옴표, 줄 길이,
 * import 순서)은 넣지 않았다. 기존 열일곱 게임을 한꺼번에 뜯어고치게 만들 뿐이다.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'apps/**', 'public/sw.js', '.tmp/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // 규칙은 아래에서 좁혀 켜지만, 플러그인은 여기서 다 등록한다. 그래야 파일에 적어 둔
    // eslint-disable 주석이 "그런 규칙 없다"는 오류로 바뀌지 않는다.
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // 앞에 _를 붙인 것은 "안 쓰는 줄 안다"는 표시다(구조 분해로 덜어 낼 때 쓴다).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    },
  },
  {
    /**
     * 훅 규칙은 React가 실제로 있는 곳에만 적용한다. 게임 엔진은 .ts에 React 없이 들어 있고,
     * 거기에는 use로 시작하는 평범한 함수가 있다(별빛 야간열차의 useSnack은 "간식을 쓴다"는
     * 뜻이다). 엔진까지 보면 그런 이름을 전부 훅으로 오해한다.
     *
     * v7의 추천 묶음은 쓰지 않는다. React Compiler를 전제로 해서, 이 저장소가 일부러 쓰는
     * 관용구(렌더 중 ref에 최신 값 넣기)까지 오류로 본다. 그건 지금 고칠 문제가 아니다.
     */
    files: ['src/**/*.tsx', 'src/shared/**/*.ts', 'src/platform/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      /**
       * 의존성 누락은 "가끔 낡은 값이 보인다"로 나타나 재현하기 어려우니 오류로 둔다.
       *
       * 일부러 좁게 둔 자리에는 eslint-disable과 함께 "넓히면 무엇이 망가지는가"를 적어 두었다.
       * 이유 없이 끄지 말 것. 끄는 쪽이 맞는 때가 있을 뿐, 그냥 조용히 넘기라는 뜻은 아니다.
       */
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // 테스트는 Node에서 돌고, 번들러를 직접 불러 쓰느라 any가 섞인다.
    files: ['tests/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
