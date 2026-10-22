import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TokenPicker, matchLiteralToTokenOption } from './TokenPicker'

afterEach(() => {
  cleanup()
})

describe('TokenPicker', () => {
  it('renders options and selects a token path', () => {
    const onChange = vi.fn()
    render(
      <TokenPicker
        options={[{ path: 'color.accent', preview: '#245' }]}
        onChange={onChange}
        variant="list"
      />,
    )
    expect(screen.getByRole('option', { name: /color.accent/ })).toBeInTheDocument()
    screen.getByRole('option', { name: /color.accent/ }).click()
    expect(onChange).toHaveBeenCalledWith('color.accent')
  })

  it('shows current path and clear affordance', () => {
    const onClear = vi.fn()
    render(
      <TokenPicker
        options={[{ path: 'color.accent', preview: '#245' }]}
        value="color.accent"
        onClear={onClear}
        clearLabel="Clear token"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveTextContent('color.accent')
    screen.getByRole('button', { name: 'Clear token' }).click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('allowNone option invokes onClear', () => {
    const onClear = vi.fn()
    render(
      <TokenPicker
        options={[{ path: 'radius.md' }]}
        value="radius.md"
        allowNone
        noneLabel="None"
        onClear={onClear}
        variant="list"
      />,
    )
    screen.getByRole('option', { name: 'None' }).click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders an optional label icon', () => {
    render(
      <TokenPicker
        label="Fill"
        icon={<span data-testid="token-icon">F</span>}
        options={[{ path: 'color.accent' }]}
      />,
    )
    expect(screen.getByTestId('token-icon')).toBeInTheDocument()
    expect(screen.getByText('Fill')).toBeInTheDocument()
  })

  it('does not render a free-text CSS input', () => {
    const { container } = render(
      <TokenPicker options={[{ path: 'color.accent' }]} value="color.accent" />,
    )
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('allowLiteral: typing drafts locally; blur fires onLiteralChange; pick still fires onChange', () => {
    const onChange = vi.fn()
    const onLiteralChange = vi.fn()
    const { rerender } = render(
      <TokenPicker
        label="Padding"
        allowLiteral
        options={[{ path: 'space.md', label: 'space.md · 16px', preview: '16px' }]}
        value={null}
        literalValue=""
        onChange={onChange}
        onLiteralChange={onLiteralChange}
        variant="list"
      />,
    )
    const input = screen.getByLabelText('Padding')
    expect(input).toBeInstanceOf(HTMLInputElement)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '12' } })
    expect(onLiteralChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('12')
    fireEvent.blur(input)
    expect(onLiteralChange).toHaveBeenCalledWith('12')

    rerender(
      <TokenPicker
        label="Padding"
        allowLiteral
        options={[{ path: 'space.md', label: 'space.md · 16px', preview: '16px' }]}
        value="space.md"
        literalValue=""
        onChange={onChange}
        onLiteralChange={onLiteralChange}
        variant="list"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveValue('space.md · 16px')
    screen.getByRole('option', { name: /space\.md/ }).click()
    expect(onChange).toHaveBeenCalledWith('space.md')
    expect(screen.getByRole('button', { name: 'Padding token' })).toBeInTheDocument()
  })

  it('allowLiteral: clear shows when literal is set', () => {
    const onClear = vi.fn()
    render(
      <TokenPicker
        label="Width"
        allowLiteral
        options={[{ path: 'size.md' }]}
        literalValue="120"
        onClear={onClear}
        clearLabel="Clear token"
      />,
    )
    screen.getByRole('button', { name: 'Clear token' }).click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('allowLiteral: promote control when unbound literal + onPromoteLiteral', () => {
    const onPromote = vi.fn()
    const { rerender } = render(
      <TokenPicker
        label="Radius"
        allowLiteral
        options={[{ path: 'radius.control.md' }]}
        literalValue="12px"
        onPromoteLiteral={onPromote}
        promoteLiteralLabel="Save as token"
      />,
    )
    screen.getByTestId('token-picker-promote').click()
    expect(onPromote).toHaveBeenCalledTimes(1)

    rerender(
      <TokenPicker
        label="Radius"
        allowLiteral
        options={[{ path: 'radius.control.md' }]}
        value="radius.control.md"
        literalValue="12px"
        onPromoteLiteral={onPromote}
        promoteLiteralLabel="Save as token"
      />,
    )
    expect(screen.queryByTestId('token-picker-promote')).toBeNull()
  })

  it('allowLiteral + color: swatch opens ColorPicker and emits hex', () => {
    const onLiteralChange = vi.fn()
    render(
      <TokenPicker
        label="Fill"
        allowLiteral
        previewKind="color"
        options={[{ path: 'color.action.primary', preview: '#0b3d2e' }]}
        literalValue="#112233"
        onLiteralChange={onLiteralChange}
      />,
    )
    expect(screen.getByTestId('token-picker-color')).toBeInTheDocument()
    expect(screen.getByTestId('token-picker-trigger')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('token-picker-color'))
    expect(screen.getByTestId('color-picker-panel')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('color-picker-hex'), { target: { value: '#ff0000' } })
    fireEvent.blur(screen.getByTestId('color-picker-hex'))
    expect(onLiteralChange).toHaveBeenCalledWith('#ff0000')
  })

  it('allowLiteral + color + browser: swatch and browse open one combined panel', () => {
    const onLiteralChange = vi.fn()
    const onChange = vi.fn()
    render(
      <TokenPicker
        label="Fill"
        browser
        allowLiteral
        previewKind="color"
        options={[{ path: 'color.action.primary', label: 'Primary', preview: '#0b3d2e' }]}
        literalValue="#112233"
        onLiteralChange={onLiteralChange}
        onChange={onChange}
        scopes={[{ id: 'all', label: 'All' }]}
        scope="all"
      />,
    )
    fireEvent.click(screen.getByTestId('token-picker-color'))
    expect(screen.getByTestId('token-picker-browser')).toHaveClass('ds-token-picker__browser--with-color')
    expect(screen.getByTestId('color-picker-panel')).toBeInTheDocument()
    expect(screen.getByTestId('token-picker-search')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('color-picker-hex'), { target: { value: '#00ff00' } })
    fireEvent.blur(screen.getByTestId('color-picker-hex'))
    expect(onLiteralChange).toHaveBeenCalledWith('#00ff00')
    fireEvent.click(screen.getByRole('option', { name: /Primary/i }))
    expect(onChange).toHaveBeenCalledWith('color.action.primary')
  })

  it('emptyQueryCap truncates until the user searches', () => {
    const options = Array.from({ length: 60 }, (_, i) => ({
      path: `font.${i}`,
      label: `Font ${i}`,
      category: 'google',
    }))
    render(
      <TokenPicker
        label="Font"
        browser
        options={options}
        emptyQueryCap={10}
        scopes={[
          { id: 'google', label: 'Google' },
          { id: 'all', label: 'All' },
        ]}
        scope="google"
      />,
    )
    fireEvent.click(screen.getByTestId('token-picker-trigger'))
    expect(screen.getByTestId('token-picker-search')).toBeInTheDocument()
    expect(screen.getAllByRole('option').length).toBeLessThanOrEqual(10)
    expect(screen.getByTestId('token-picker-list-cap')).toHaveTextContent(/60/)
    fireEvent.change(screen.getByTestId('token-picker-search'), { target: { value: 'Font 12' } })
    expect(screen.queryByTestId('token-picker-list-cap')).toBeNull()
    expect(screen.getByRole('option', { name: /^Font 12$/ })).toBeInTheDocument()
  })

  it('cycles prev/next through options when allowCycle', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const options = [
      { path: 'radius.sm' },
      { path: 'radius.md' },
      { path: 'radius.lg' },
    ]
    const { rerender } = render(
      <TokenPicker
        options={options}
        value="radius.md"
        onChange={onChange}
        onClear={onClear}
        allowCycle
        allowNone
      />,
    )
    screen.getByRole('button', { name: 'Next token' }).click()
    expect(onChange).toHaveBeenCalledWith('radius.lg')
    screen.getByRole('button', { name: 'Previous token' }).click()
    expect(onChange).toHaveBeenCalledWith('radius.sm')

    rerender(
      <TokenPicker
        options={options}
        value="radius.sm"
        onChange={onChange}
        onClear={onClear}
        allowCycle
        allowNone
      />,
    )
    screen.getByRole('button', { name: 'Previous token' }).click()
    expect(onClear).toHaveBeenCalled()
  })

  it('compact variant hides the list until the strip is opened', () => {
    const onChange = vi.fn()
    render(
      <TokenPicker
        label="Radius"
        options={[{ path: 'radius.md' }, { path: 'radius.lg' }]}
        value="radius.md"
        onChange={onChange}
      />,
    )
    expect(screen.queryByRole('option', { name: /radius.lg/ })).toBeNull()
    expect(document.querySelector('.ds-token-picker--compact')).not.toBeNull()
    fireEvent.click(screen.getByTestId('token-picker-trigger'))
    expect(screen.getByRole('option', { name: /radius.lg/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: /radius.lg/ }))
    expect(onChange).toHaveBeenCalledWith('radius.lg')
    expect(screen.queryByRole('option', { name: /radius.lg/ })).toBeNull()
  })

  it('empty strip shows emptyLabel, not noneLabel', () => {
    render(
      <TokenPicker
        options={[{ path: 'fontFamily.sans', label: 'Sans' }]}
        value={null}
        allowNone
        noneLabel="Clear token"
        emptyLabel="—"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveTextContent('—')
    expect(screen.getByTestId('token-picker-value')).not.toHaveTextContent('Clear token')
  })

  it('bound strip shows option label, not the token path', () => {
    render(
      <TokenPicker
        options={[{ path: 'fontFamily.sans', label: 'Sans' }]}
        value="fontFamily.sans"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveTextContent('Sans')
    expect(screen.getByTestId('token-picker-value')).not.toHaveTextContent('fontFamily.sans')
  })

  it('fontPreview applies font-family on the value label', () => {
    render(
      <TokenPicker
        options={[
          {
            path: 'fontFamily.serif',
            label: 'Serif',
            fontPreview: 'Georgia, serif',
          },
        ]}
        value="fontFamily.serif"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveStyle({ fontFamily: 'Georgia, serif' })
  })

  it('sampleStyle applies font-weight on the value label', () => {
    render(
      <TokenPicker
        options={[{ path: 'fontWeight.semibold', label: 'Semibold', sampleStyle: { fontWeight: '600' } }]}
        value="fontWeight.semibold"
      />,
    )
    expect(screen.getByTestId('token-picker-value')).toHaveStyle({ fontWeight: '600' })
  })

  it('current strip uses magazine ink tokens, not a grey well', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../css/components.css'), 'utf8')
    const start = css.indexOf('.ds-token-picker__current {')
    const block = css.slice(start, start + 420)
    expect(block).toContain('background: transparent')
    expect(block).toContain('color: var(--ink)')
    expect(block).toContain('border-bottom: 1px solid var(--ink)')
    expect(block).not.toContain('#f7f7f7')
    expect(css).not.toContain('color: var(--fg, #111)')
    const tokens = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../css/tokens.css'), 'utf8')
    expect(tokens).toContain('--surface-1: var(--bg1)')
    expect(tokens).toContain('--border: var(--line)')
  })

  describe('browser mode (P77)', () => {
    const options = [
      { path: 'radius.sm', label: 'radius.sm', preview: '4px', category: 'radius' },
      { path: 'radius.md', label: 'radius.md', preview: '8px', category: 'radius' },
      { path: 'radius.lg', label: 'radius.lg', preview: '16px', category: 'radius' },
      { path: 'space.md', label: 'space.md', preview: '16px', category: 'space' },
    ]

    it('opens search + scopes and picks a path', () => {
      const onChange = vi.fn()
      const onRecent = vi.fn()
      render(
        <TokenPicker
          label="Radius"
          browser
          options={options}
          value="radius.md"
          onChange={onChange}
          scopes={[
            { id: 'suggested', label: 'Suggested' },
            { id: 'radius', label: 'Radius' },
            { id: 'all', label: 'All' },
          ]}
          suggestedPaths={['radius.sm', 'radius.md', 'radius.lg']}
          recentPaths={[]}
          onRecentPathsChange={onRecent}
          previewKind="radius"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      expect(screen.getByTestId('token-picker-search')).toBeInTheDocument()
      expect(screen.getByTestId('token-picker-drag-header')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Suggested' })).toHaveAttribute('aria-selected', 'true')
      fireEvent.change(screen.getByTestId('token-picker-search'), { target: { value: 'lg' } })
      expect(screen.getByRole('option', { name: /radius.lg/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /radius.sm/ })).toBeNull()
      fireEvent.click(screen.getByRole('option', { name: /radius.lg/ }))
      expect(onChange).toHaveBeenCalledWith('radius.lg')
      expect(onRecent).toHaveBeenCalledWith(['radius.lg'])
    })

    it('renders browser rows as preview / value / name columns', () => {
      render(
        <TokenPicker
          label="Padding"
          browser
          options={[
            {
              path: 'spacing.padding.sm',
              label: 'padding.sm',
              valueLabel: '0.5rem',
              preview: '0.5rem',
              category: 'space',
            },
          ]}
          value={null}
          scopes={[{ id: 'all', label: 'All' }]}
          previewKind="space"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const option = screen.getByRole('option', { name: /0\.5rem · padding\.sm/i })
      expect(option).toHaveClass('ds-token-picker__option--columns')
      expect(option.querySelector('.ds-token-picker__value')).toHaveTextContent('0.5rem')
      expect(option.querySelector('.ds-token-picker__path')).toHaveTextContent('padding.sm')
      const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../css/components.css'), 'utf8')
      expect(css).toContain('.ds-token-picker__option--columns')
      expect(css).toContain('grid-template-columns: 1.25rem 4.5rem minmax(0, 1fr)')
      expect(css).toContain('align-content: start')
    })

    it('leads type/font rows with the label (no empty value column)', () => {
      render(
        <TokenPicker
          label="Font"
          browser
          options={[
            {
              path: 'gf:DM Sans',
              label: 'DM Sans',
              category: 'google',
              fontPreview: 'DM Sans',
            },
          ]}
          value={null}
          scopes={[{ id: 'all', label: 'All' }]}
          previewKind="type"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const option = screen.getByRole('option', { name: 'DM Sans' })
      expect(option).toHaveClass('ds-token-picker__option--lead')
      expect(option).not.toHaveClass('ds-token-picker__option--columns')
      expect(option.querySelector('.ds-token-picker__path--lead')).toHaveTextContent('DM Sans')
    })

    it('uses swatch+path rows for color without valueLabel', () => {
      render(
        <TokenPicker
          label="Color"
          browser
          options={[{ path: 'color.primary', label: 'Primary', preview: '#112233', category: 'color' }]}
          value={null}
          scopes={[{ id: 'all', label: 'All' }]}
          previewKind="color"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const option = screen.getByRole('option', { name: 'Primary' })
      expect(option).toHaveClass('ds-token-picker__option--swatch')
      expect(option).not.toHaveClass('ds-token-picker__option--columns')
    })

    it('exposes resize handles and grows width on drag', () => {
      render(
        <TokenPicker
          label="Min H"
          browser
          options={[{ path: 'size.sm', label: 'sm', valueLabel: '24px', preview: '24px', category: 'size' }]}
          value={null}
          scopes={[{ id: 'all', label: 'All' }]}
          previewKind="size"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const panel = screen.getByRole('dialog', { name: /Min H token browser/i })
      expect(panel).toHaveStyle({ width: '300px', height: '380px' })
      expect(screen.getByTestId('token-picker-resize-e')).toBeInTheDocument()
      expect(screen.getByTestId('token-picker-resize-s')).toBeInTheDocument()
      expect(screen.getByTestId('token-picker-resize-se')).toBeInTheDocument()
      fireEvent.mouseDown(screen.getByTestId('token-picker-resize-e'), { clientX: 300, clientY: 200 })
      fireEvent.mouseMove(window, { clientX: 380, clientY: 200 })
      fireEvent.mouseUp(window)
      expect(panel).toHaveStyle({ width: '380px' })
    })

    it('filters by scope tab', () => {
      render(
        <TokenPicker
          label="Tokens"
          browser
          options={options}
          value={null}
          scopes={[
            { id: 'suggested', label: 'Suggested' },
            { id: 'radius', label: 'Radius' },
            { id: 'all', label: 'All' },
          ]}
          suggestedPaths={['radius.md']}
          previewKind="radius"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      expect(screen.getByRole('option', { name: /radius.md/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /space.md/ })).toBeNull()
      fireEvent.click(screen.getByRole('tab', { name: 'All' }))
      expect(screen.getByRole('option', { name: /space.md/ })).toBeInTheDocument()
    })

    it('color options with valueLabel keep columnar rows', () => {
      const onChange = vi.fn()
      render(
        <TokenPicker
          label="Fill"
          browser
          previewKind="color"
          options={[
            { path: 'color.accent', label: 'accent', valueLabel: '#224455', preview: '#224455', category: 'color' },
            { path: 'color.muted', label: 'muted', valueLabel: '#666', preview: '#666', category: 'color' },
          ]}
          value="color.accent"
          onChange={onChange}
          scopes={[
            { id: 'suggested', label: 'Suggested' },
            { id: 'all', label: 'All' },
          ]}
          suggestedPaths={['color.accent']}
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      expect(document.querySelectorAll('.ds-token-picker__swatch-btn')).toHaveLength(0)
      const panel = screen.getByRole('dialog', { name: /Fill token browser/i })
      expect(panel).toHaveStyle({ height: '380px', minHeight: '380px' })
      fireEvent.click(screen.getByRole('tab', { name: 'All' }))
      expect(panel).toHaveStyle({ height: '380px', minHeight: '380px' })
      expect(screen.getByRole('option', { name: /#666 · muted/i })).toHaveClass(
        'ds-token-picker__option--columns',
      )
      fireEvent.click(screen.getByRole('option', { name: /#666 · muted/i }))
      expect(onChange).toHaveBeenCalledWith('color.muted')
    })

    it('keyboard ArrowDown + Enter selects highlighted option', () => {
      const onChange = vi.fn()
      render(
        <TokenPicker
          label="Radius"
          browser
          options={options}
          value="radius.sm"
          onChange={onChange}
          scopes={[{ id: 'all', label: 'All' }]}
          suggestedPaths={['radius.sm', 'radius.md', 'radius.lg']}
          previewKind="radius"
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const search = screen.getByTestId('token-picker-search')
      fireEvent.keyDown(search, { key: 'ArrowDown' })
      fireEvent.keyDown(search, { key: 'Enter' })
      expect(onChange).toHaveBeenCalledWith('radius.md')
    })

    it('portals browser into nearest dialog ancestor (modal top layer)', () => {
      render(
        <dialog open className="ds-dialog">
          <div className="ds-dialog-sheet">
            <div className="ds-dialog-body">
              <TokenPicker
                label="Subject"
                browser
                options={options}
                value="radius.md"
                onChange={() => {}}
                scopes={[{ id: 'all', label: 'All' }]}
              />
            </div>
          </div>
        </dialog>,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      const browser = screen.getByTestId('token-picker-browser')
      expect(browser.parentElement?.classList.contains('ds-dialog')).toBe(true)
    })

    it('shows Current header and list promote for unbound literal', () => {
      const onPromote = vi.fn()
      render(
        <TokenPicker
          label="Fill"
          browser
          allowLiteral
          previewKind="color"
          options={[{ path: 'color.accent', label: 'accent', preview: '#224455', category: 'color' }]}
          value={null}
          literalValue="#ff0000"
          onPromoteLiteral={onPromote}
          listPromoteLabel="Add your own token"
          scopes={[{ id: 'all', label: 'All' }]}
        />,
      )
      fireEvent.click(screen.getByTestId('token-picker-trigger'))
      expect(screen.getByTestId('token-picker-active')).toHaveTextContent('#ff0000')
      fireEvent.click(screen.getByTestId('token-picker-list-promote'))
      expect(onPromote).toHaveBeenCalled()
    })

    it('hides Current header when showActiveHeader is false', () => {
      render(
        <TokenPicker
          allowLiteral
          options={[{ path: 'color.accent', preview: '#f00' }]}
          value="color.accent"
          variant="list"
          showActiveHeader={false}
        />,
      )
      expect(screen.queryByTestId('token-picker-active')).toBeNull()
    })
  })

  describe('literal match', () => {
    it('matchLiteralToTokenOption matches hex preview', () => {
      const hit = matchLiteralToTokenOption(
        [{ path: 'color.accent', preview: '#224455' }],
        '#224455',
        'color',
      )
      expect(hit?.path).toBe('color.accent')
    })

    it('matchLiteralToTokenOption matches fontPreview (Google faces)', () => {
      const hit = matchLiteralToTokenOption(
        [
          { path: 'typography.body.family', label: 'Body', fontPreview: 'Noto Sans JP' },
          { path: 'gf:Inter', label: 'Inter', fontPreview: 'Inter', category: 'google' },
        ],
        'Inter',
        'type',
      )
      expect(hit?.path).toBe('gf:Inter')
    })

    it('blur binds matching literal via onChange instead of onLiteralChange', () => {
      const onChange = vi.fn()
      const onLiteralChange = vi.fn()
      render(
        <TokenPicker
          label="Fill"
          allowLiteral
          previewKind="color"
          options={[{ path: 'color.accent', label: 'accent', preview: '#224455' }]}
          value={null}
          literalValue=""
          onChange={onChange}
          onLiteralChange={onLiteralChange}
          variant="list"
        />,
      )
      const input = screen.getByLabelText('Fill')
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '#224455' } })
      fireEvent.blur(input)
      expect(onChange).toHaveBeenCalledWith('color.accent')
      expect(onLiteralChange).not.toHaveBeenCalled()
    })

    it('unbound font literal keeps Google option selected', () => {
      render(
        <TokenPicker
          allowLiteral
          previewKind="type"
          options={[
            { path: 'typography.body.family', label: 'Body', fontPreview: 'Noto Sans JP' },
            { path: 'gf:Inter', label: 'Inter', fontPreview: 'Inter' },
          ]}
          value={null}
          literalValue="Inter"
          variant="list"
        />,
      )
      const inter = screen.getByRole('option', { name: /^Inter$/ })
      expect(inter).toHaveAttribute('aria-selected', 'true')
      const body = screen.getByRole('option', { name: /^Body$/ })
      expect(body).toHaveAttribute('aria-selected', 'false')
    })

    it('picking an option after focusing the strip does not recommit the old literal', () => {
      const onChange = vi.fn()
      const onLiteralChange = vi.fn()
      render(
        <TokenPicker
          label="Font"
          allowLiteral
          previewKind="type"
          options={[
            { path: 'typography.body.family', label: 'Body', fontPreview: 'Noto Sans JP' },
            { path: 'gf:Inter', label: 'Inter', fontPreview: 'Inter' },
          ]}
          value="typography.body.family"
          literalValue=""
          onChange={onChange}
          onLiteralChange={onLiteralChange}
          variant="list"
        />,
      )
      const input = screen.getByLabelText('Font')
      fireEvent.focus(input)
      const inter = screen.getByRole('option', { name: /^Inter$/ })
      fireEvent.mouseDown(inter)
      fireEvent.click(inter)
      expect(onChange).toHaveBeenCalledWith('gf:Inter')
      expect(onLiteralChange).not.toHaveBeenCalled()
    })

    it('blur without edits does not recommit the bound strip label', () => {
      const onChange = vi.fn()
      const onLiteralChange = vi.fn()
      render(
        <TokenPicker
          label="Size"
          allowLiteral
          previewKind="type"
          options={[
            { path: 'typography.body.family', label: 'Body', preview: '0.78rem' },
            { path: 'sz:16px', label: '16px' },
          ]}
          value="typography.body.family"
          literalValue=""
          onChange={onChange}
          onLiteralChange={onLiteralChange}
          variant="list"
        />,
      )
      const input = screen.getByLabelText('Size')
      fireEvent.focus(input)
      fireEvent.blur(input)
      expect(onChange).not.toHaveBeenCalled()
      expect(onLiteralChange).not.toHaveBeenCalled()
    })
  })
})
