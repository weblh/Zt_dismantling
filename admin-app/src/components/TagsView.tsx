import { useEffect, useRef } from 'react';
import { Dropdown } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useVisitedViews } from '@/contexts/VisitedViewsContext';

export default function TagsView() {
  const navigate = useNavigate();
  const { views, activePath, removeView, closeOthers, closeAll } = useVisitedViews();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Keep active tag visible when switching
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activePath, views.length]);

  const contextMenuFor = (path: string, affix?: boolean): MenuProps['items'] => [
    {
      key: 'refresh',
      label: '刷新页面',
      onClick: () => {
        if (path === activePath) {
          window.location.reload();
        } else {
          navigate(path);
        }
      },
    },
    {
      key: 'close',
      label: '关闭',
      disabled: !!affix,
      onClick: () => removeView(path),
    },
    {
      key: 'close-others',
      label: '关闭其他',
      onClick: () => closeOthers(path),
    },
    {
      key: 'close-all',
      label: '关闭全部',
      onClick: () => closeAll(),
    },
  ];

  return (
    <div className="tags-view">
      <div className="tags-view-scroll" ref={scrollerRef}>
        {views.map((view) => {
          const active = view.path === activePath;
          return (
            <Dropdown
              key={view.path}
              menu={{ items: contextMenuFor(view.path, view.affix) }}
              trigger={['contextMenu']}
            >
              <div
                ref={active ? activeRef : undefined}
                className={`tags-view-item${active ? ' is-active' : ''}`}
                onClick={() => {
                  if (!active) navigate(view.path);
                }}
                onMouseDown={(e) => {
                  // Middle-click close
                  if (e.button === 1 && !view.affix) {
                    e.preventDefault();
                    removeView(view.path);
                  }
                }}
                title={view.title}
              >
                <span className="tags-view-title">{view.title}</span>
                {!view.affix && (
                  <CloseOutlined
                    className="tags-view-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeView(view.path);
                    }}
                  />
                )}
              </div>
            </Dropdown>
          );
        })}
      </div>
    </div>
  );
}
