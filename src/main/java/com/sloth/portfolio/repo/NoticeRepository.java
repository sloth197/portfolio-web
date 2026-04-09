package com.sloth.portfolio.repo;

import com.sloth.portfolio.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    @Query("select n from Notice n order by case when n.pinned = true then 1 else 0 end desc, n.createdAt desc")
    List<Notice> findAllSortedForNoticePage();

    @Modifying(flushAutomatically = true)
    @Query("update Notice n set n.pinned = false where n.pinned = true")
    int clearPinnedNotices();

    @Modifying(flushAutomatically = true)
    @Query("update Notice n set n.pinned = false where n.pinned = true and n.id <> :noticeId")
    int clearPinnedNoticesExcept(@Param("noticeId") Long noticeId);
}
