package com.menux.menu_x_backend.dto.common;

import org.springframework.data.domain.Page;

import java.util.List;

public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;

    public static <T> PageResponse<T> from(Page<T> page) {
        PageResponse<T> pr = new PageResponse<>();
        pr.content = page.getContent();
        pr.page = page.getNumber();
        pr.size = page.getSize();
        pr.totalElements = page.getTotalElements();
        pr.totalPages = page.getTotalPages();
        pr.hasNext = page.hasNext();
        return pr;
    }

    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isHasNext() { return hasNext; }
}
