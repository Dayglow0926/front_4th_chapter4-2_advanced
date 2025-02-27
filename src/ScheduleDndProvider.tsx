import {
  DndContext,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PropsWithChildren, useCallback } from 'react';
import { CellSize, DAY_LABELS } from './constants.ts';
import { useScheduleContext } from './ScheduleContext.tsx';

function createSnapModifier(): Modifier {
  return ({ transform, containerNodeRect, draggingNodeRect }) => {
    const containerTop = containerNodeRect?.top ?? 0;
    const containerLeft = containerNodeRect?.left ?? 0;
    const containerBottom = containerNodeRect?.bottom ?? 0;
    const containerRight = containerNodeRect?.right ?? 0;

    const { top = 0, left = 0, bottom = 0, right = 0 } = draggingNodeRect ?? {};

    const minX = containerLeft - left + 120 + 1;
    const minY = containerTop - top + 40 + 1;
    const maxX = containerRight - right;
    const maxY = containerBottom - bottom;

    return {
      ...transform,
      x: Math.min(
        Math.max(
          Math.round(transform.x / CellSize.WIDTH) * CellSize.WIDTH,
          minX
        ),
        maxX
      ),
      y: Math.min(
        Math.max(
          Math.round(transform.y / CellSize.HEIGHT) * CellSize.HEIGHT,
          minY
        ),
        maxY
      ),
    };
  };
}

const modifiers = [createSnapModifier()];

export default function ScheduleDndProvider({ children }: PropsWithChildren) {
  const { schedulesMap, setSchedulesMap } = useScheduleContext();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 드래그 종료 핸들러 메모이제이션
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, delta } = event;
      const { x, y } = delta;
      const [tableId, index] = active.id.split(':');
      const schedule = schedulesMap[tableId][Number(index)];
      const nowDayIndex = DAY_LABELS.indexOf(
        schedule.day as (typeof DAY_LABELS)[number]
      );
      const moveDayIndex = Math.floor(x / 80);
      const moveTimeIndex = Math.floor(y / 30);

      // 불변성을 유지하면서 특정 테이블의 특정 스케줄만 업데이트
      setSchedulesMap((prev) => {
        // 새로운 스케줄 배열 생성
        const updatedSchedules = [...prev[tableId]];

        // 특정 인덱스의 스케줄만 업데이트
        updatedSchedules[Number(index)] = {
          ...schedule,
          day: DAY_LABELS[nowDayIndex + moveDayIndex],
          range: schedule.range.map((time) => time + moveTimeIndex),
        };

        // 새로운 객체 반환
        return {
          ...prev,
          [tableId]: updatedSchedules,
        };
      });
    },
    [schedulesMap, setSchedulesMap]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      {children}
    </DndContext>
  );
}
